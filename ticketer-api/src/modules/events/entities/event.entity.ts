import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('events')
@Index('idx_events_search', ['search_vector'])
@Index('idx_events_city_date', ['city', 'starts_at'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  host_id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  cover_image_url: string;

  @Column()
  venue_name: string;

  @Column()
  venue_address: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  event_type: string;

  @Column('timestamptz')
  starts_at: Date;

  @Column('timestamptz')
  ends_at: Date;

  @Column()
  status: string;

  @Column({ default: 'NGN' })
  currency: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('tsvector', { select: false, nullable: true })
  search_vector: any;

  @Column('int', { default: 3 })
  max_tickets_per_user: number;

  @Column('timestamptz', { nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_id' })
  host: User;
}
