import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { WhatsAppService } from './channels/whatsapp.service';
import { TelegramService } from './channels/telegram.service';

@Module({
  providers: [NotificationsService, WhatsAppService, TelegramService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
