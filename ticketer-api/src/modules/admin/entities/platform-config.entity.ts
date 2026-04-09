import { Entity, Column, UpdateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('platform_config')
export class PlatformConfig {
  @PrimaryColumn()
  key: string;

  @Column('jsonb')
  value: any;

  @Column('text', { nullable: true })
  description: string;

  @Column('uuid', { nullable: true })
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;
}
