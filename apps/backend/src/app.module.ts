import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { QueuesModule } from './modules/queues/queues.module';
import { GatewaysModule } from './gateways/gateways.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProcessorsModule } from './modules/queues/processors/processors.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChatModule } from './modules/chat/chat.module';
import { StatsModule } from './modules/stats/stats.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    DatabaseModule,
    AuthModule,
    RestaurantsModule,
    TablesModule,
    MenuModule,
    BookingsModule,
    CatalogModule,
    QueuesModule,
    GatewaysModule,
    NotificationsModule,
    ProcessorsModule,
    WebhooksModule,
    ChatModule,
    StatsModule,
    ReviewsModule,
  ],
})
export class AppModule {}
