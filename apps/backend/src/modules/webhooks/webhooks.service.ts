import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueuesService } from '../queues/queues.service';
import { AvailabilityService } from '../bookings/availability.service';
import { addMinutes } from '../../common/utils/time.util';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Client) private clientsRepo: Repository<Client>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private queuesService: QueuesService,
    private availabilityService: AvailabilityService,
  ) {}

  async handleTwilioWebhook(body: Record<string, string>): Promise<void> {
    const phone = body['From']?.replace('whatsapp:', '') || body['From'] || '';
    const text = (body['Body'] || '').trim().toUpperCase();
    if (!phone || !text) return;

    const client = await this.clientsRepo.findOne({ where: { phone } });
    if (!client) {
      this.logger.warn(`Unknown client with phone ${phone}`);
      return;
    }

    await this.handleResponse(client, text);
  }

  async handleTelegramWebhook(update: any): Promise<void> {
    const message = update?.message;
    if (!message) return;

    const chatId = String(message.from?.id);
    const text = (message.text || '').trim().toUpperCase();
    if (!chatId || !text) return;

    const client = await this.clientsRepo.findOne({ where: { telegram_chat_id: chatId } });
    if (!client) {
      this.logger.warn(`Unknown Telegram client with chatId ${chatId}`);
      return;
    }

    await this.handleResponse(client, text);
  }

  private async handleResponse(client: Client, text: string): Promise<void> {
    const booking = await this.findLastActiveBooking(client.id);
    if (!booking) {
      this.logger.warn(`No active booking for client ${client.id}`);
      return;
    }

    this.logger.log(`Response from client ${client.id}: "${text}" for booking ${booking.id}`);

    if (text === 'ДА' || text === 'YES') {
      booking.reminder_response = 'confirmed';
      await this.bookingsRepo.save(booking);
      this.logger.log(`Booking ${booking.id} confirmed by client`);
      return;
    }

    if (text === 'НЕТ' || text === 'NO' || text === 'ОТМЕНА') {
      await this.bookingsService.cancelByToken(booking.cancel_token);
      await this.queuesService.scheduleOperatorAlert(booking, 'Клиент отменил бронь через мессенджер');
      this.logger.log(`Booking ${booking.id} cancelled by client response`);
      return;
    }

    if (text === 'УХОДИМ') {
      booking.reminder_response = 'leaving';
      await this.bookingsRepo.save(booking);
      this.logger.log(`Booking ${booking.id}: client is leaving`);
      return;
    }

    if (text === 'ОСТАЮСЬ') {
      await this.handleStaying(booking);
      return;
    }

    if (text.startsWith('НАС СТАЛО БОЛЬШЕ')) {
      const parts = text.split(' ');
      const extraGuests = parseInt(parts[parts.length - 1]) || 1;
      await this.handleMoreGuests(booking, extraGuests);
      return;
    }

    // Ответ на запрос отзыва (1-5)
    const rating = parseInt(text);
    if (rating >= 1 && rating <= 5) {
      this.logger.log(`Booking ${booking.id}: client rated ${rating}/5`);
      booking.reminder_response = `review:${rating}`;
      await this.bookingsRepo.save(booking);
      return;
    }

    this.logger.log(`Unknown response "${text}" from client ${client.id}`);
  }

  private async handleStaying(booking: Booking): Promise<void> {
    const newTimeEnd = addMinutes(booking.time_end, 30);

    // Проверяем нет ли следующих броней на эти столики
    const tableIds = booking.booking_tables?.map((bt) => bt.table_id) || [];
    if (tableIds.length === 0) {
      booking.time_end = newTimeEnd;
      await this.bookingsRepo.save(booking);
      this.logger.log(`Booking ${booking.id} extended to ${newTimeEnd}`);
      return;
    }

    const conflicts = await this.bookingsRepo
      .createQueryBuilder('b')
      .innerJoin('b.booking_tables', 'bt')
      .where('bt.table_id IN (:...tableIds)', { tableIds })
      .andWhere('b.date = :date', { date: booking.date })
      .andWhere('b.id != :id', { id: booking.id })
      .andWhere(`b.status NOT IN ('${BookingStatus.CANCELLED}', '${BookingStatus.NO_SHOW}')`)
      .andWhere('b.time_start < :newTimeEnd AND b.time_end > :timeEnd', {
        newTimeEnd,
        timeEnd: booking.time_end,
      })
      .getCount();

    if (conflicts === 0) {
      booking.time_end = newTimeEnd;
      await this.bookingsRepo.save(booking);
      this.logger.log(`Booking ${booking.id} extended to ${newTimeEnd}`);
    } else {
      await this.queuesService.scheduleOperatorAlert(
        booking,
        'Клиент хочет остаться, но следующее бронирование конфликтует',
      );
      this.logger.warn(`Cannot extend booking ${booking.id} — conflict with next booking`);
    }
  }

  private async handleMoreGuests(booking: Booking, extraGuests: number): Promise<void> {
    this.logger.log(
      `Booking ${booking.id}: ${extraGuests} extra guests joining. Alerting operator.`,
    );
    await this.queuesService.scheduleOperatorAlert(
      booking,
      `Гостей стало больше на ${extraGuests}. Возможно нужен дополнительный столик.`,
    );
  }

  private async findLastActiveBooking(clientId: string): Promise<Booking | null> {
    return this.bookingsRepo
      .createQueryBuilder('b')
      .where('b.client_id = :clientId', { clientId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.ARRIVED],
      })
      .leftJoinAndSelect('b.booking_tables', 'bt')
      .leftJoinAndSelect('b.restaurant', 'r')
      .leftJoinAndSelect('b.client', 'c')
      .orderBy('b.created_at', 'DESC')
      .getOne();
  }
}
