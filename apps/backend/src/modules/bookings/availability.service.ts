import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BookingTable } from './entities/booking-table.entity';
import { Table } from '../tables/entities/table.entity';
import { addMinutes } from '../../common/utils/time.util';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(BookingTable) private btRepo: Repository<BookingTable>,
    @InjectRepository(Table) private tablesRepo: Repository<Table>,
  ) {}

  async getAvailableTables(
    restaurantId: string,
    date: string,
    timeStart: string,
    duration = 90,
  ): Promise<{ table: Table; status: 'free' | 'busy' }[]> {
    const timeEnd = addMinutes(timeStart, duration);

    const busyBTs = await this.btRepo
      .createQueryBuilder('bt')
      .innerJoin('bt.booking', 'b')
      .where('b.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('b.date = :date', { date })
      .andWhere(
        `b.status NOT IN ('${BookingStatus.CANCELLED}', '${BookingStatus.NO_SHOW}')`,
      )
      .andWhere('b.time_start < :timeEnd AND b.time_end > :timeStart', {
        timeEnd,
        timeStart,
      })
      .getMany();

    const busyTableIds = new Set(busyBTs.map((bt) => bt.table_id));

    const tables = await this.tablesRepo.find({
      where: { restaurant_id: restaurantId, is_active: true },
    });

    return tables.map((table) => ({
      table,
      status: busyTableIds.has(table.id) ? 'busy' : 'free',
    }));
  }
}
