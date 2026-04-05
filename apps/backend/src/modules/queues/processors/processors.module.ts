import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingsModule } from '../../bookings/bookings.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { SendReminderProcessor } from './send-reminder.processor';
import { EndReminderProcessor } from './end-reminder.processor';
import { ReviewRequestProcessor } from './review-request.processor';
import { OperatorAlertProcessor } from './operator-alert.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'send_reminder' },
      { name: 'end_reminder' },
      { name: 'review_request' },
      { name: 'operator_alert' },
    ),
    BookingsModule,
    NotificationsModule,
  ],
  providers: [
    SendReminderProcessor,
    EndReminderProcessor,
    ReviewRequestProcessor,
    OperatorAlertProcessor,
  ],
})
export class ProcessorsModule {}
