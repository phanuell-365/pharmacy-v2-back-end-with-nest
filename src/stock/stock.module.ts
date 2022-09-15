import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { stockProvider } from './stock.provider';
import { MedicinesModule } from '../medicines/medicines.module';

@Module({
  imports: [MedicinesModule],
  controllers: [StockController],
  providers: [StockService, ...stockProvider],
})
export class StockModule {}
