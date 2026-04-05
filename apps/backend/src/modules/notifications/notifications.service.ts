import { Injectable, Logger } from '@nestjs/common';
import { Booking } from '../bookings/entities/booking.entity';
import { NotificationChannel } from '../clients/entities/client.entity';
import { WhatsAppService } from './channels/whatsapp.service';
import { TelegramService } from './channels/telegram.service';
import { bookingConfirmedTemplate } from './templates/booking-confirmed';
import { reminderTemplate } from './templates/reminder';
import { endReminderTemplate } from './templates/end-reminder';
import { reviewRequestTemplate } from './templates/review-request';
import { operatorAlertTemplate } from './templates/operator-alert';

export type NotificationTemplate =
  | 'booking-confirmed'
  | 'reminder'
  | 'end-reminder'
  | 'review-request'
  | 'operator-alert';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private whatsapp: WhatsAppService,
    private telegram: TelegramService,
  ) {}

  async send(
    booking: Booking,
    template: NotificationTemplate,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!booking.client) {
      this.logger.warn(`No client for booking ${booking.id}, skipping notification`);
      return;
    }

    const text = this.buildText(booking, template, data);
    const channel = booking.client.notification_channel;

    try {
      if (channel === NotificationChannel.TELEGRAM && booking.client.telegram_chat_id) {
        await this.telegram.sendMessage(booking.client.telegram_chat_id, text);
      } else {
        await this.whatsapp.sendMessage(booking.client.phone, text);
      }
    } catch (err) {
      this.logger.error(`Failed to send ${template} for booking ${booking.id}: ${err.message}`);
    }
  }

  private buildText(
    booking: Booking,
    template: NotificationTemplate,
    data?: Record<string, string>,
  ): string {
    switch (template) {
      case 'booking-confirmed':
        return bookingConfirmedTemplate(booking);
      case 'reminder':
        return reminderTemplate(booking);
      case 'end-reminder':
        return endReminderTemplate(booking);
      case 'review-request':
        return reviewRequestTemplate(booking);
      case 'operator-alert':
        return operatorAlertTemplate(booking, data?.reason || 'Требуется внимание');
      default:
        return `Уведомление по брони #${booking.id}`;
    }
  }
}
