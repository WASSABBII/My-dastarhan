import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(private config: ConfigService) {
    this.botToken = this.config.get('TELEGRAM_BOT_TOKEN') || '';
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      // Mock: вывод в консоль
      this.logger.log(`[Telegram → ${chatId}]\n${text}`);
      return;
    }

    // TODO: реальная отправка через Telegram Bot API
    // const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    // await fetch(url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    // });
    this.logger.log(`[Telegram → ${chatId}]\n${text}`);
  }
}
