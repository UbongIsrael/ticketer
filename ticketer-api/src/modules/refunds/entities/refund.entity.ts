import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ticket_id: string;

  @Column('uuid')
  user_id: string;

  @Column('varchar', { default: 'buyback' })
  type: string;

  @Column('int')
  original_amount_minor: number;

  @Column('int')
  refund_amount_minor: number;

  @Column('int')
  platform_margin_minor: number;

  @Column('varchar')
  status: string;

  @Column('varchar', { default: 'paystack' })
  provider: string;

  @Column('varchar', { nullable: true })
  provider_reference: string;

  @Column('varchar', { nullable: true })
  failure_reason: string;

  @Column('int', { default: 0 })
  retry_count: number;

  @Column('timestamptz', { nullable: true })
  settled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

