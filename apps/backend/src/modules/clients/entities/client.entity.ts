import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.WHATSAPP,
  })
  notification_channel: NotificationChannel;

  @Column({ nullable: true })
  telegram_chat_id: string;

  @CreateDateColumn()
  created_at: Date;
}
