import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Booking } from '../bookings/entities/booking.entity';
import { parseDateTime } from '../../common/utils/time.util';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('send_reminder') private reminderQueue: Queue,
    @InjectQueue('end_reminder') private endReminderQueue: Queue,
  ) {}

  async scheduleReminders(booking: Booking): Promise<void> {
    const startMs = parseDateTime(booking.date, booking.time_start).getTime();
    const endMs = parseDateTime(booking.date, booking.time_end).getTime();
    const now = Date.now();

    const reminderDelay = startMs - now - 60 * 60 * 1000; // -1h
    if (reminderDelay > 0) {
      await this.reminderQueue.add(
        'send_reminder',
        { bookingId: booking.id },
        { delay: reminderDelay },
      );
    }

    const endReminderDelay = endMs - now - 15 * 60 * 1000; // -15min
    if (endReminderDelay > 0) {
      await this.endReminderQueue.add(
        'end_reminder',
        { bookingId: booking.id },
        { delay: endReminderDelay },
      );
    }
  }
}
