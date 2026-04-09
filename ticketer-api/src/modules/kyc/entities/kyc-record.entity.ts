import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('kyc_records')
export class KycRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  provider: string;

  @Column({ unique: true })
  provider_reference: string;

  @Column()
  status: string;

  @Column()
  id_type: string;

  @Column('jsonb', { nullable: true })
  verification_data: any;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_code: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
