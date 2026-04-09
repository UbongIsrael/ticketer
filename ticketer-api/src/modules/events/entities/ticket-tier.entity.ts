import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('ticket_tiers')
export class TicketTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column()
  name: string;

  @Column('int')
  price_minor: number;

  @Column('int')
  total_quantity: number;

  @Column('int', { default: 0 })
  sold_count: number;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  perks: string[];

  @Column('timestamptz', { nullable: true })
  sale_starts_at: Date;

  @Column('timestamptz', { nullable: true })
  sale_ends_at: Date;

  @Column('int', { default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
