import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CustomersService } from '../customers.service';
import { customersProvider } from '../customers.provider';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, CustomersService, ...customersProvider],
})
export class AnalyticsModule {}
