import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Client } from '../modules/clients/entities/client.entity';
import { Restaurant } from '../modules/restaurants/entities/restaurant.entity';
import { RestaurantPhoto } from '../modules/restaurants/entities/restaurant-photo.entity';
import { RestaurantUser } from '../modules/restaurants/entities/restaurant-user.entity';
import { RestaurantGroup } from '../modules/restaurants/entities/restaurant-group.entity';
import { Table } from '../modules/tables/entities/table.entity';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { MenuCategory } from '../modules/menu/entities/menu-category.entity';
import { MenuItem } from '../modules/menu/entities/menu-item.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { BookingTable } from '../modules/bookings/entities/booking-table.entity';
import { Review } from '../modules/reviews/entities/review.entity'; 

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [
          User,
          Client,
          Restaurant,
          RestaurantPhoto,
          RestaurantUser,
          RestaurantGroup,
          Table,
          Subscription,
          MenuCategory,
          MenuItem,
          Booking,
          BookingTable,
          Review,
        ],
        synchronize: true, // только для dev, в проде — миграции
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
