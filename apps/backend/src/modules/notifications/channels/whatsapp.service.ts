import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.accountSid = this.config.get('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.config.get('TWILIO_AUTH_TOKEN') || '';
    this.from = this.config.get('TWILIO_WHATSAPP_FROM') || '';
  }

  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.accountSid || !this.authToken) {
      // Mock: вывод в консоль
      this.logger.log(`[WhatsApp → ${to}]\n${text}`);
      return;
    }

    // TODO: реальная отправка через Twilio
    // const client = require('twilio')(this.accountSid, this.authToken);
    // await client.messages.create({
    //   from: `whatsapp:${this.from}`,
    //   to: `whatsapp:${to}`,
    //   body: text,
    // });
    this.logger.log(`[WhatsApp → ${to}]\n${text}`);
  }
}
