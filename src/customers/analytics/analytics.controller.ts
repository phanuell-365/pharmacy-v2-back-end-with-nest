import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../auth/guards';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { DateQueryDto } from './dto/date-query.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('/customers/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('today')
  customersToday() {
    return this.analyticsService.customersToday();
  }

  @Get('range')
  customersWithinRange(@Query() queries: DateQueryDto) {
    return this.analyticsService.customersWithinRange(queries.s, queries.e);
  }

  @Get('week')
  thisWeeklyCustomers() {
    return this.analyticsService.thisWeeklyCustomers();
  }
}
