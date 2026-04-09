import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('host_settlements')
export class HostSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  host_id: string;

  @Column('int')
  gross_revenue_minor: number;

  @Column('int')
  host_commission_minor: number;

  @Column('int')
  net_payout_minor: number;

  @Column('int', { default: 0 })
  partial_payout_minor: number;

  @Column('int', { default: 0 })
  final_payout_minor: number;

  @Column()
  commission_tier: string;

  @Column('decimal')
  commission_rate: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  provider_reference: string;

  @Column('timestamptz', { nullable: true })
  partial_paid_at: Date;

  @Column('timestamptz', { nullable: true })
  settled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_id' })
  host: User;
}
