import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  requester_id: string;

  @Column()
  change_type: string;

  @Column('jsonb')
  proposed_changes: any;

  @Column()
  status: string;

  @Column('uuid', { nullable: true })
  reviewer_id: string;

  @Column('text', { nullable: true })
  review_notes: string;

  @Column('timestamptz', { nullable: true })
  reviewed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;
}
