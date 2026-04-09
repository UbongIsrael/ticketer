import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('host_settlements')
export class HostSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  host_id: string;

  @Column('int', { default: 0 })
  gross_revenue_minor: number;

  @Column('int', { default: 0 })
  host_commission_minor: number;

  @Column('int', { default: 0 })
  net_payout_minor: number;

  @Column('int', { default: 0 })
  partial_payout_minor: number;

  @Column('int', { default: 0 })
  final_payout_minor: number;

  @Column('varchar', { nullable: true })
  commission_tier: string;

  @Column('decimal', { nullable: true })
  commission_rate: number;

  @Column('varchar', { default: 'pending' })
  status: string;

  @Column('varchar', { nullable: true })
  provider_reference: string;

  @Column('timestamptz', { nullable: true })
  partial_paid_at: Date;

  @Column('timestamptz', { nullable: true })
  settled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

