import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('simple-array')
  ticket_ids: string[];

  @Column('int')
  ticket_price_minor: number;

  @Column('int')
  buyer_service_fee_minor: number;

  @Column('int')
  total_charged_minor: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  provider: string;

  @Column({ unique: true })
  provider_reference: string;

  @Column()
  status: string;

  @Column()
  payment_channel: string;

  @Column('jsonb', { nullable: true })
  provider_metadata: any;

  @Column('timestamptz', { nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}
