import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { TicketTier } from '../../events/entities/ticket-tier.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tickets')
@Index('idx_tickets_event_status', ['event_id', 'status'])
@Index('idx_tickets_reserved', ['expires_at'], { where: "status = 'reserved'" })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  tier_id: string;

  @Column('uuid', { nullable: true })
  @Index('idx_tickets_owner')
  owner_id: string;

  @Column({ unique: true, nullable: true })
  @Index('idx_tickets_code')
  ticket_code: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  qr_payload: string;

  @Column('uuid', { nullable: true })
  payment_id: string;

  @Column('uuid', { nullable: true })
  refund_id: string;

  @Column('timestamptz', { nullable: true })
  reserved_at: Date;

  @Column('timestamptz', { nullable: true })
  paid_at: Date;

  @Column('timestamptz', { nullable: true })
  issued_at: Date;

  @Column('timestamptz', { nullable: true })
  validated_at: Date;

  @Column('timestamptz', { nullable: true })
  voided_at: Date;

  @Column('timestamptz', { nullable: true })
  expires_at: Date;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => TicketTier)
  @JoinColumn({ name: 'tier_id' })
  tier: TicketTier;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
