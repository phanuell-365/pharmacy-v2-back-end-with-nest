import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { OrderStatuses } from '../orders/enum';
import { JwtGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  currentMonthDailySalesReport() {
    return this.analyticsService.currentMonthDailySalesReport();
  }

  @Get('sales/month/search')
  monthDailySalesReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.analyticsService.monthDailySalesReport(month, +year);
  }

  @Get('sales/year/search')
  yearlyMonthlySalesReport(@Query('year') year: string) {
    return this.analyticsService.yearlyMonthlySalesReport(+year);
  }

  @Get('purchases')
  currentMonthlyDailyPurchasesReport() {
    return this.analyticsService.currentMonthlyDailyPurchasesReport();
  }

  @Get('purchases/month/search')
  monthDailyPurchasesReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.analyticsService.monthDailyPurchasesReport(month, +year);
  }

  @Get('purchases/year/search')
  yearlyMonthlyPurchasesReport(@Query('year') year: string) {
    return this.analyticsService.yearlyMonthlyPurchasesReport(+year);
  }

  @Get('orders')
  currentMonthOrderReport() {
    return this.analyticsService.currentMonthOrderReport();
  }

  @Get('orders/status/search')
  currentMonthOrderCategoryReport(@Query('status') status: OrderStatuses) {
    return this.analyticsService.currentMonthOrderCategoryReport(status);
  }

  @Get('orders/month/search')
  monthDailyOrdersReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.analyticsService.monthDailyOrdersReport(month, +year);
  }

  @Get('orders/month/status/search')
  monthDailyOrdersCategoryReport(
    @Query('month') month: string,
    @Query('status') status: OrderStatuses,
    @Query('year') year: string,
  ) {
    return this.analyticsService.monthDailyOrdersCategoryReport(
      month,
      status,
      +year,
    );
  }

  @Get('orders/year/search')
  yearlyMonthlyOrdersReport(@Query('year') year: string) {
    return this.analyticsService.yearlyMonthlyOrdersReport(+year);
  }

  @Get('orders/year/status/search')
  yearlyMonthlyOrdersCategoryReport(
    @Query('year') year: string,
    @Query('status') status: OrderStatuses,
  ) {
    return this.analyticsService.yearlyMonthlyOrdersCategoryReport(
      +year,
      status,
    );
  }
}
