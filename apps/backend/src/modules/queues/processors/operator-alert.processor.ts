import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('operator_alert')
export class OperatorAlertProcessor extends WorkerHost {
  private readonly logger = new Logger(OperatorAlertProcessor.name);

  constructor(
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: string; reason: string }>): Promise<void> {
    const { bookingId, reason } = job.data;
    this.logger.warn(`[OPERATOR ALERT] booking=${bookingId} reason="${reason}"`);

    const booking = await this.bookingsService.findById(bookingId);
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for operator alert`);
      return;
    }

    await this.notificationsService.send(booking, 'operator-alert', { reason });
  }
}
