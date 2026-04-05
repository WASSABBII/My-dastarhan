import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('twilio')
  async twilioWebhook(@Body() body: Record<string, string>): Promise<{ status: string }> {
    await this.webhooksService.handleTwilioWebhook(body);
    return { status: 'ok' };
  }

  @Post('telegram')
  async telegramWebhook(@Body() body: any): Promise<{ ok: boolean }> {
    await this.webhooksService.handleTelegramWebhook(body);
    return { ok: true };
  }
}
