import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../auth/guards';
import { RolesGuard } from '../../auth/guards/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('/customers/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('today')
  customersToday() {
    return this.analyticsService.customersToday();
  }
}
