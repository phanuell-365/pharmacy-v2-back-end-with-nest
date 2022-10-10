import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { OrderStatuses } from '../orders/enum';
import { SalesStatus } from '../sales/enums';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('users')
  async users(@Res() res: Response) {
    await this.reportsService.allUsersReport(res);
  }

  @Get('orders')
  async orders(
    @Res() res: Response,
    @Query('category') category: OrderStatuses,
  ) {
    await this.reportsService.allOrdersReport(res, category);
  }

  @Get('sales')
  async sales(
    @Res() res: Response,
    @Query('grouped') grouped: string,
    @Query('ungrouped') ungrouped: string,
    @Query('selection') selection: SalesStatus,
  ) {
    await this.reportsService.allSalesReport(
      res,
      grouped,
      ungrouped,
      selection,
    );
  }

  @Get('sales/customers/:id')
  async salesByCustomer(@Res() res: Response, @Param('id') customerId: string) {
    await this.reportsService.generateSalesReceipt(res, customerId);
  }

  @Get('medicines')
  async medicines(@Res() res: Response) {
    await this.reportsService.allMedicinesReport(res);
  }

  @Get('medicines/stock')
  async medicinesStock(@Res() res: Response) {
    await this.reportsService.allMedicineStockReport(res);
  }

  @Get('medicines/out-of-stock')
  async medicinesOutOfStock(@Res() res: Response) {
    await this.reportsService.medicinesOutOfStockReport(res);
  }

  @Get('medicines/expired')
  async medicinesExpiredMedicine(@Res() res: Response) {
    await this.reportsService.expiredMedicinesReport(res);
  }

  @Get('purchases')
  async purchases(@Res() res: Response) {
    await this.reportsService.allPurchasesReport(res);
  }

  @Get('customers')
  async customers(@Res() res: Response) {
    await this.reportsService.allCustomersReport(res);
  }

  @Get('suppliers')
  async suppliers(@Res() res: Response) {
    await this.reportsService.allSuppliersReport(res);
  }
}
