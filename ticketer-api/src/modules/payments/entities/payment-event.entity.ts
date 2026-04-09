import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  provider_reference: string;

  @Column()
  event_type: string;

  @Column('jsonb')
  payload: any;

  @Column('timestamptz', { nullable: true })
  processed_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
