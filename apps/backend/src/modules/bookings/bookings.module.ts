import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingTable } from './entities/booking-table.entity';
import { Table } from '../tables/entities/table.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AvailabilityService } from './availability.service';
import { GatewaysModule } from '../../gateways/gateways.module';
import { QueuesModule } from '../queues/queues.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingTable, Table]),
    GatewaysModule,
    QueuesModule,
    NotificationsModule,
  ],
  providers: [BookingsService, AvailabilityService],
  controllers: [BookingsController],
  exports: [BookingsService, AvailabilityService],
})
export class BookingsModule {}
