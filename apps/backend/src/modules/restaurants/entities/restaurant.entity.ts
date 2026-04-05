import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RestaurantGroup } from './restaurant-group.entity';
import { RestaurantPhoto } from './restaurant-photo.entity';

export enum RestaurantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  group_id: string;

  @ManyToOne(() => RestaurantGroup, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: RestaurantGroup;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  address: string;

  @Column()
  cuisine_type: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  video_url: string;

  @Column({ nullable: true })
  twilio_phone_number: string;

  @Column({ nullable: true })
  operator_phone: string;

  @Column({ nullable: true })
  place_id: string;

  @Column({ default: 'Asia/Almaty' })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  working_hours: Record<string, string>;

  @Column({ default: 15 })
  buffer_minutes: number;

  @Column({ default: false })
  deposit_required: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit_amount: number;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  cover_photo_url: string;

  @Column({
    type: 'enum',
    enum: RestaurantStatus,
    default: RestaurantStatus.PENDING,
  })
  status: RestaurantStatus;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => RestaurantPhoto, (photo) => photo.restaurant)
  photos: RestaurantPhoto[];
}
