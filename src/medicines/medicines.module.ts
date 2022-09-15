import { Module } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';
import { medicinesProvider } from './medicines.provider';

@Module({
  controllers: [MedicinesController],
  providers: [MedicinesService, ...medicinesProvider],
  exports: [MedicinesService],
})
export class MedicinesModule {}
