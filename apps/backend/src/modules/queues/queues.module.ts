import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueuesService } from './queues.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host') || 'localhost',
          port: config.get('redis.port') || 6379,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'send_reminder' }, { name: 'end_reminder' }),
  ],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
