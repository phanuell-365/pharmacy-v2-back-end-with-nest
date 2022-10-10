import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { SalesStatus } from './enums';
import { Role } from '../users/enums';
import { Roles } from '../auth/decorator';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACY_TECHNICIAN)
  create(
    // @Body('MedicineId') medicineId: string,
    // @Body('CustomerId') customerId: string,
    @Body() createSaleDto: CreateSaleDto[],
  ) {
    return this.salesService.create(
      // medicineId,
      // customerId,
      createSaleDto,
    );
  }

  @Get('customer/:id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACY_TECHNICIAN)
  findAllSalesByCustomer(
    @Param('id') customerId: string,
    @Query('withId') withId: string,
  ) {
    return this.salesService.findAllSalesByCustomerId(customerId, withId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACY_TECHNICIAN)
  findAll(
    @Query('resource') resource: string,
    @Query('status') status: string,
    @Query('date') saleDate: Date,
    @Query('customerId') customerId: string,
    @Query('withId') withId: string,
    @Query('today') today: boolean,
    @Query('ungrouped') ungrouped: string,
  ) {
    if (resource && resource === 'status') {
      return this.salesService.findSalesStatus();
    }

    if (customerId) {
      return this.salesService.findAllSalesByCustomerId(customerId, withId);
    }

    if (today) return this.salesService.findAllSalesMadeToday(withId);
    if (saleDate) return this.salesService.findAllBySaleDate(saleDate, withId);
    if (ungrouped) return this.salesService.findAllUnGroupedSales(withId);

    switch (status) {
      case SalesStatus.ISSUED:
        return this.salesService.findAllIssuedSales(withId);
      case SalesStatus.PENDING:
        return this.salesService.findAllPendingSales(withId);
      case SalesStatus.CANCELLED:
        return this.salesService.findAllCancelledSales(withId);
      default: {
        return this.salesService.findAllGroupedBySaleDate(withId);
      }
    }
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACY_TECHNICIAN)
  findOne(@Query('withId') withId: string, @Param('id') salesId: string) {
    return this.salesService.findOne(salesId, withId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACY_TECHNICIAN)
  update(
    @Param('id') salesId: string,
    @Body('MedicineId') medicineId: string,
    @Body('CustomerId') customerId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(
      medicineId,
      customerId,
      salesId,
      updateSaleDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  @Delete(':id')
  remove(@Param('id') salesId: string) {
    return this.salesService.remove(salesId);
  }
}
