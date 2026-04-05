import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Table } from '../../tables/entities/table.entity';

@Entity('booking_tables')
@Unique(['booking_id', 'table_id'])
@Index(['table_id', 'booking_id'])
export class BookingTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  booking_id: string;

  @Column()
  table_id: string;

  @ManyToOne(() => Booking, (b) => b.booking_tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Table, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Table;
}
