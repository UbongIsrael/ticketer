import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequiresCapability } from '../../common/decorators/requires-capability.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequiresCapability('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('approvals')
  async getPendingApprovals() {
    return this.adminService.getPendingApprovals();
  }

  @Patch('approvals/:id')
  async resolveApproval(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.resolveApproval(id, status, user.id, notes);
  }

  @Get('refunds/failed')
  async getFailedRefunds() {
    return this.adminService.getFailedRefunds();
  }

  @Post('refunds/:id/retry')
  async retryFailedRefund(@Param('id') id: string) {
    return this.adminService.retryFailedRefund(id);
  }

  @Get('settlements')
  async getSettlements() {
    return this.adminService.getSettlements();
  }

  @Get('config')
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Patch('config/:key')
  async updateConfig(
    @Param('key') key: string,
    @Body('value') value: any,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateConfig(key, value, user.id);
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}

