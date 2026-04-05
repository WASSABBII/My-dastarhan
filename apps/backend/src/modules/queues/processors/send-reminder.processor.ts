import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { BookingStatus } from '../../bookings/entities/booking.entity';

@Processor('send_reminder')
export class SendReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(SendReminderProcessor.name);

  constructor(
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: string }>): Promise<void> {
    const { bookingId } = job.data;
    this.logger.log(`Processing send_reminder for booking ${bookingId}`);

    const booking = await this.bookingsService.findById(bookingId);
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.NO_SHOW) {
      this.logger.log(`Booking ${bookingId} is ${booking.status}, skipping reminder`);
      return;
    }

    await this.notificationsService.send(booking, 'reminder');

    booking.reminder_sent_at = new Date();
    await this.bookingsService.saveBooking(booking);

    this.logger.log(`Reminder sent for booking ${bookingId}`);
  }
}
