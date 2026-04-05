import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingStatus, BookingCreatedBy } from './entities/booking.entity';
import { BookingTable } from './entities/booking-table.entity';
import { Table } from '../tables/entities/table.entity';
import { CreateBookingDto } from './dto/booking.dto';
import { AvailabilityService } from './availability.service';
import { BookingsGateway } from '../../gateways/bookings.gateway';
import { QueuesService } from '../queues/queues.service';
import { NotificationsService } from '../notifications/notifications.service';
import { addMinutes } from '../../common/utils/time.util';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(BookingTable) private btRepo: Repository<BookingTable>,
    @InjectDataSource() private dataSource: DataSource,
    private availabilityService: AvailabilityService,
    private gateway: BookingsGateway,
    private queuesService: QueuesService,
    private notificationsService: NotificationsService,
  ) {}

  async createBooking(dto: CreateBookingDto, clientId: string): Promise<Booking> {
    const booking = await this.dataSource.transaction(async (manager) => {
      // SELECT FOR UPDATE — lock the table rows
      await manager
        .createQueryBuilder(Table, 't')
        .setLock('pessimistic_write')
        .whereInIds(dto.tableIds)
        .getMany();

      const timeEnd = addMinutes(dto.timeStart, dto.estimatedDuration ?? 90);

      // Re-check conflicts inside transaction
      const conflicts = await manager
        .createQueryBuilder(BookingTable, 'bt')
        .innerJoin('bt.booking', 'b')
        .where('bt.table_id IN (:...tableIds)', { tableIds: dto.tableIds })
        .andWhere('b.date = :date', { date: dto.date })
        .andWhere(
          `b.status NOT IN ('${BookingStatus.CANCELLED}', '${BookingStatus.NO_SHOW}')`,
        )
        .andWhere('b.time_start < :timeEnd AND b.time_end > :timeStart', {
          timeEnd,
          timeStart: dto.timeStart,
        })
        .getMany();

      if (conflicts.length > 0) {
        throw new ConflictException('Один или несколько столиков уже заняты на это время');
      }

      const newBooking = manager.create(Booking, {
        restaurant_id: dto.restaurantId,
        client_id: clientId,
        date: dto.date,
        time_start: dto.timeStart,
        time_end: timeEnd,
        estimated_duration: dto.estimatedDuration ?? 90,
        guests_count: dto.guestsCount,
        cancel_token: uuidv4(),
        status: BookingStatus.CONFIRMED,
        created_by: BookingCreatedBy.CLIENT,
      });
      await manager.save(newBooking);

      const bts = dto.tableIds.map((tid) =>
        manager.create(BookingTable, { booking_id: newBooking.id, table_id: tid }),
      );
      await manager.save(bts);

      const fullBooking = await manager.findOne(Booking, {
        where: { id: newBooking.id },
        relations: ['booking_tables', 'restaurant', 'client'],
      });

      if (!fullBooking) {
        throw new NotFoundException('Ошибка при создании бронирования');
      }

      return fullBooking;
    });

    // After transaction: notify socket + schedule queues + send confirmation
    for (const bt of booking.booking_tables) {
      this.gateway.notifyTableStatusChanged({
        restaurantId: booking.restaurant_id,
        tableId: bt.table_id,
        date: booking.date,
        time: booking.time_start,
        status: 'busy',
      });
    }
    await this.queuesService.scheduleReminders(booking).catch(() => { /* non-critical */ });
    await this.queuesService.scheduleReviewRequest(booking).catch(() => { /* non-critical */ });
    this.notificationsService.send(booking, 'booking-confirmed').catch(() => { /* non-critical */ });

    return booking;
  }

  async findMyBookings(clientId: string): Promise<Booking[]> {
    return this.bookingsRepo.find({
      where: { client_id: clientId },
      relations: ['restaurant', 'booking_tables', 'booking_tables.table'],
      order: { created_at: 'DESC' },
    });
  }

  async getByToken(token: string): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { cancel_token: token },
      relations: ['restaurant', 'client', 'booking_tables', 'booking_tables.table'],
    });
    if (!booking) throw new NotFoundException('Бронирование не найдено');
    return booking;
  }

  async cancelByToken(token: string): Promise<Booking> {
    const booking = await this.getByToken(token);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('Бронирование уже отменено');
    }
    booking.status = BookingStatus.CANCELLED;
    const saved = await this.bookingsRepo.save(booking);
    for (const bt of booking.booking_tables) {
      this.gateway.notifyTableStatusChanged({
        restaurantId: booking.restaurant_id,
        tableId: bt.table_id,
        date: booking.date,
        time: booking.time_start,
        status: 'free',
      });
    }
    return saved;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookingsRepo.findOne({
      where: { id },
      relations: ['client', 'restaurant', 'booking_tables'],
    });
  }

  async saveBooking(booking: Booking): Promise<Booking> {
    return this.bookingsRepo.save(booking);
  }

  async getByRestaurantAndDate(restaurantId: string, date: string): Promise<Booking[]> {
    return this.bookingsRepo.find({
      where: { restaurant_id: restaurantId, date },
      relations: ['client', 'booking_tables', 'booking_tables.table'],
      order: { time_start: 'ASC' },
    });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['booking_tables'],
    });
    if (!booking) throw new NotFoundException('Бронирование не найдено');
    booking.status = status;
    const saved = await this.bookingsRepo.save(booking);
    for (const bt of booking.booking_tables) {
      const tableStatus = [BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(status) ? 'free' : 'busy';
      this.gateway.notifyTableStatusChanged({
        restaurantId: booking.restaurant_id,
        tableId: bt.table_id,
        date: booking.date,
        time: booking.time_start,
        status: tableStatus,
      });
    }
    return saved;
  }

  async cancelByAuth(id: string, clientId: string): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['booking_tables'],
    });
    if (!booking) throw new NotFoundException('Бронирование не найдено');
    if (booking.client_id !== clientId) throw new ForbiddenException('Нет доступа');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('Бронирование уже отменено');
    }
    booking.status = BookingStatus.CANCELLED;
    const saved = await this.bookingsRepo.save(booking);
    for (const bt of booking.booking_tables) {
      this.gateway.notifyTableStatusChanged({
        restaurantId: booking.restaurant_id,
        tableId: bt.table_id,
        date: booking.date,
        time: booking.time_start,
        status: 'free',
      });
    }
    return saved;
  }
}
