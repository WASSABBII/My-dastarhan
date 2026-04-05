import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { BookingStatus } from '../../bookings/entities/booking.entity';

@Processor('review_request')
export class ReviewRequestProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewRequestProcessor.name);

  constructor(
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: string }>): Promise<void> {
    const { bookingId } = job.data;
    this.logger.log(`Processing review_request for booking ${bookingId}`);

    const booking = await this.bookingsService.findById(bookingId);
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.NO_SHOW) {
      this.logger.log(`Booking ${bookingId} is ${booking.status}, skipping review request`);
      return;
    }

    await this.notificationsService.send(booking, 'review-request');
    this.logger.log(`Review request sent for booking ${bookingId}`);
  }
}
