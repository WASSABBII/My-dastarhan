import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { Client } from '../../clients/entities/client.entity';
import { BookingTable } from './booking-table.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  EXTENDED = 'extended',
}

export enum BookingCreatedBy {
  CLIENT = 'client',
  STAFF = 'staff',
}

@Entity('bookings')
@Index(['restaurant_id', 'date', 'status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurant_id: string;

  @Column()
  client_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time_start: string;

  @Column({ type: 'time' })
  time_end: string;

  @Column({ default: 90 })
  estimated_duration: number;

  @Column()
  guests_count: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @Column({ type: 'enum', enum: BookingCreatedBy, default: BookingCreatedBy.CLIENT })
  created_by: BookingCreatedBy;

  @Column({ unique: true })
  cancel_token: string;

  @Column({ default: false })
  prepaid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prepaid_amount: number;

  @Column({ nullable: true })
  reminder_sent_at: Date;

  @Column({ nullable: true })
  end_reminder_sent_at: Date;

  @Column({ nullable: true })
  reminder_response: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => BookingTable, (bt) => bt.booking, { cascade: true })
  booking_tables: BookingTable[];
}
