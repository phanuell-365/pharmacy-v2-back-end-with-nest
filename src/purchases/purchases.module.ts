import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';
import { purchasesRepository } from './purchases.repository';
import { ordersProvider } from '../orders/orders.provider';
import { stockProvider } from '../stock/stock.provider';

@Module({
  imports: [OrdersModule, StockModule],
  controllers: [PurchasesController],
  providers: [
    PurchasesService,
    ...purchasesRepository,
    ...ordersProvider,
    ...stockProvider,
  ],
})
export class PurchasesModule {}
