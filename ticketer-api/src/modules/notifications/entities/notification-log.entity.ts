import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('varchar')
  type: string;

  @Column('varchar')
  channel: string;

  @Column('jsonb')
  payload: any;

  @Column('varchar', { default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
