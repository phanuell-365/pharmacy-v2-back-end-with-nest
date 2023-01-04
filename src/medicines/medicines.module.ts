import { Module } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';
import { medicinesProvider } from './medicines.provider';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  controllers: [MedicinesController],
  providers: [MedicinesService, ...medicinesProvider],
  exports: [MedicinesService],
  imports: [AnalyticsModule],
})
export class MedicinesModule {}
