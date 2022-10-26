import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { OrderStatuses } from '../orders/enum';
import { SalesStatus } from '../sales/enums';
import { JwtGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorator';
import { User } from '../users/entities';

@UseGuards(JwtGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('users')
  async users(@Res() res: Response, @GetUser() user: User) {
    await this.reportsService.allUsersReport(res, user);
  }

  @Get('orders')
  async orders(
    @Res() res: Response,
    @Query('category') category: OrderStatuses,
    @GetUser() user: User,
  ) {
    await this.reportsService.allOrdersReport(res, category, user);
  }

  @Get('sales')
  async sales(
    @Res() res: Response,
    @Query('grouped') grouped: string,
    @Query('ungrouped') ungrouped: string,
    @Query('selection') selection: SalesStatus,
    @GetUser() user: User,
  ) {
    await this.reportsService.allSalesReport(
      res,
      grouped,
      ungrouped,
      selection,
      user,
    );
  }

  @Get('sales/customers/:id')
  async salesByCustomer(
    @Res() res: Response,
    @Param('id') customerId: string,
    @Query('saleDate') saleDate: string,
    @GetUser() user: User,
  ) {
    await this.reportsService.generateSalesReceipt(
      res,
      customerId,
      user,
      saleDate,
    );
  }

  @Get('medicines')
  async medicines(@Res() res: Response, @GetUser() user: User) {
    await this.reportsService.allMedicinesReport(res, user);
  }

  @Get('medicines/stock')
  async medicinesStock(
    @Res() res: Response,
    @GetUser() user: User,
    @Query('paranoid') paranoid: string,
  ) {
    await this.reportsService.allMedicineStockReport(res, user, paranoid);
  }

  @Get('medicines/out-of-stock')
  async medicinesOutOfStock(
    @Res() res: Response,
    @GetUser() user: User,
    @Query('paranoid') paranoid: string,
  ) {
    await this.reportsService.medicinesOutOfStockReport(res, user, paranoid);
  }

  @Get('medicines/expired')
  async medicinesExpiredMedicine(
    @Res() res: Response,
    @GetUser() user: User,
    @Query('paranoid') paranoid: string,
  ) {
    await this.reportsService.expiredMedicinesReport(res, user, paranoid);
  }

  @Get('purchases')
  async purchases(@Res() res: Response, @GetUser() user: User) {
    await this.reportsService.allPurchasesReport(res, user);
  }

  @Get('customers')
  async customers(@Res() res: Response, @GetUser() user: User) {
    await this.reportsService.allCustomersReport(res, user);
  }

  @Get('suppliers')
  async suppliers(@Res() res: Response, @GetUser() user: User) {
    await this.reportsService.allSuppliersReport(res, user);
  }
}
