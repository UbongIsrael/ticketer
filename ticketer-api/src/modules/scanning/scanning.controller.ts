import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ScanningService } from './scanning.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequiresCapability } from '../../common/decorators/requires-capability.decorator';

@Controller('scanning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScanningController {
  constructor(private readonly scanningService: ScanningService) {}

  @Get('manifest/:eventId')
  @RequiresCapability('HOST')
  async getManifest(@Param('eventId') eventId: string) {
    return this.scanningService.getManifest(eventId);
  }

  @Post('validate')
  @RequiresCapability('HOST')
  async validateScan(@Body('qrPayload') qrPayload: string) {
    return this.scanningService.validateScan(qrPayload);
  }

  @Post('sync')
  @RequiresCapability('HOST')
  async syncOfflineScans(@Body('scans') scans: Array<{ qrPayload: string }>) {
    return this.scanningService.syncOfflineScans(scans);
  }
}
