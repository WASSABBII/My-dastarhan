import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from './restaurant.entity';

export enum RestaurantUserRole {
  OWNER = 'owner',
  STAFF = 'staff',
}

@Entity('restaurant_users')
@Unique(['user_id', 'restaurant_id'])
export class RestaurantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'enum', enum: RestaurantUserRole })
  role: RestaurantUserRole;
}
