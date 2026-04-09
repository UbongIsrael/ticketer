import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_announcements')
export class EventAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  author_id: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column()
  channel: string;

  @Column('timestamptz', { nullable: true })
  sent_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;
}
