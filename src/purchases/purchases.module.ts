import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';
import { purchasesRepository } from './purchases.repository';
import { ordersProvider } from '../orders/orders.provider';
import { stockProvider } from '../stock/stock.provider';
import { medicinesProvider } from '../medicines/medicines.provider';
import { MedicinesModule } from '../medicines/medicines.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { suppliersProvider } from '../suppliers/suppliers.provider';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    OrdersModule,
    StockModule,
    MedicinesModule,
    SuppliersModule,
    AnalyticsModule,
  ],
  controllers: [PurchasesController],
  providers: [
    PurchasesService,
    ...purchasesRepository,
    ...ordersProvider,
    ...stockProvider,
    ...medicinesProvider,
    ...suppliersProvider,
  ],
})
export class PurchasesModule {}
