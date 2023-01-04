import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { suppliersProvider } from './suppliers.provider';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, ...suppliersProvider],
  imports: [AnalyticsModule],
})
export class SuppliersModule {}
