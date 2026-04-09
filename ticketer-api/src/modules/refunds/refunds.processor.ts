import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RefundsService } from './refunds.service';

@Processor('refund-retries')
export class RefundRetriesProcessor extends WorkerHost {
  constructor(private readonly refundsService: RefundsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { providerRef } = job.data;
    // Assume a simulated second attempt triggers the mock failure endpoint safely yielding further drops natively
    await this.refundsService.processMockTransferFailed(providerRef);
  }
}
