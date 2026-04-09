import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { Event } from '../entities/event.entity';
import { ApprovalRequest } from '../entities/approval-request.entity';

@Injectable()
export class EventGuardrailsInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(ApprovalRequest) private approvalRepo: Repository<ApprovalRequest>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    
    if (req.method !== 'PATCH') return next.handle();
    
    const eventId = req.params.id as string;
    const body = req.body;
    const user = (req as any).user;

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new BadRequestException('Event not found');

    const now = Date.now();
    const eventTime = event.starts_at.getTime();

    if (now >= eventTime) {
      throw new BadRequestException('Cannot edit an event that has already started');
    }

    const isRestrictedChange = ('starts_at' in body) || ('venue_name' in body) || ('city' in body) || ('address' in body);
    
    if (isRestrictedChange) {
      const msUntilEvent = eventTime - now;
      if (msUntilEvent < 24 * 60 * 60 * 1000) {
        const approval = this.approvalRepo.create({
          event_id: eventId,
          requester_id: user?.id,
          change_type: 'late_edit',
          proposed_changes: body,
          status: 'pending'
        });
        await this.approvalRepo.save(approval);
        
        res.status(202).json({
          message: 'Changes require admin approval since the event is less than 24h away.',
          approval_id: approval.id
        });
        return of(); 
      }
    }

    return next.handle();
  }
}
