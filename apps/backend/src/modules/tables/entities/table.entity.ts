import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

export enum TableShape {
  ROUND = 'round',
  SQUARE = 'square',
  RECTANGLE = 'rectangle',
}

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  label: string;

  @Column()
  capacity: number;

  @Column({ nullable: true })
  location_tag: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pos_x: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pos_y: number;

  @Column({ type: 'enum', enum: TableShape, default: TableShape.SQUARE })
  shape: TableShape;

  @Column({ default: true })
  is_active: boolean;
}
