import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { customersProvider } from './customers.provider';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, ...customersProvider],
  imports: [AnalyticsModule],
})
export class CustomersModule {}
