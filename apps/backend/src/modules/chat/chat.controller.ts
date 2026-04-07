import { Controller, Post, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { IsString, IsArray, IsOptional } from 'class-validator';

class ChatMessageDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  history?: Array<{ role: string; content: string }>;
}

@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Post(':slug')
  async chat(@Param('slug') slug: string, @Body() dto: ChatMessageDto) {
    const reply = await this.service.chat(slug, dto.message, dto.history || []);
    return { reply };
  }
}
