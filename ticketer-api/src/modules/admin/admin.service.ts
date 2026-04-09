import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequest } from '../events/entities/approval-request.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { PlatformConfig } from './entities/platform-config.entity';
import { HostSettlement } from '../events/entities/host-settlement.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ApprovalRequest) private approvalRepo: Repository<ApprovalRequest>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(HostSettlement) private settlementsRepo: Repository<HostSettlement>,
    @InjectRepository(PlatformConfig) private configRepo: Repository<PlatformConfig>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectQueue('refund-retries') private refundRetryQueue: Queue,
  ) {}

  async getPendingApprovals() { return this.approvalRepo.find({ where: { status: 'pending' } }); }
  async getFailedRefunds() { return this.refundRepo.find({ where: { status: 'failed' } }); }
  async getSettlements() { return this.settlementsRepo.find(); }

  async resolveApproval(id: string, status: string, reviewerId: string, notes?: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    approval.status = status === 'approved' ? 'approved' : 'rejected';
    approval.reviewer_id = reviewerId;
    approval.review_notes = notes || '';
    approval.reviewed_at = new Date();
    await this.approvalRepo.save(approval);
    return approval;
  }

  async getConfig() {
    return this.configRepo.find();
  }

  async updateConfig(key: string, value: any, adminId: string) {
    let config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      config = this.configRepo.create({ key, value, updated_by: adminId });
    } else {
      config.value = value;
      config.updated_by = adminId;
    }
    await this.configRepo.save(config);
    return config;
  }

  async retryFailedRefund(refundId: string) {
    const refund = await this.refundRepo.findOne({ where: { id: refundId } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'failed') return { message: 'Refund is not in failed state' };

    refund.status = 'pending';
    refund.retry_count = 0;
    refund.failure_reason = '';
    await this.refundRepo.save(refund);

    await this.refundRetryQueue.add('retry-refund', { providerRef: refund.provider_reference });
    return { message: 'Refund re-queued for processing', refund_id: refundId };
  }

  async getAnalytics() {
    const totalEvents = await this.eventRepo.count();
    const publishedEvents = await this.eventRepo
      .createQueryBuilder('e')
      .where("UPPER(e.status) = 'PUBLISHED'")
      .getCount();
    const totalTicketsSold = await this.ticketRepo
      .createQueryBuilder('t')
      .where("t.status IN (:...statuses)", { statuses: ['PAID', 'ISSUED', 'VALIDATED'] })
      .getCount();

    const revenueResult = await this.ticketRepo.query(`
      SELECT COALESCE(SUM(p.total_charged_minor), 0) as total_revenue
      FROM payments p WHERE p.status = 'completed'
    `);
    const totalRevenue = parseInt(revenueResult[0]?.total_revenue) || 0;

    const pendingRefunds = await this.refundRepo.count({ where: { status: 'failed' } });

    return {
      totalEvents,
      publishedEvents,
      totalTicketsSold,
      totalRevenue,
      pendingRefunds,
    };
  }
}

