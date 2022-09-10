import { Module } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';

@Module({
  controllers: [MedicinesController],
  providers: [MedicinesService],
})
export class MedicinesModule {}
