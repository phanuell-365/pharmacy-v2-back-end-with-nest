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
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto';
import { PurchasesService } from './purchases.service';
import { Role } from '../users/enums';
import { Roles } from '../auth/decorator';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  create(
    @Body('OrderId') orderId: string,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(orderId, createPurchaseDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  findAll(
    @Query('withId') withId: string,
    @Query('today') today: string,
    @Query('resource') resource: string,
  ) {
    if (resource === 'profit')
      return this.purchasesService.getPercentageProfit();
    return this.purchasesService.findAll(withId, today);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST, Role.PHARMACIST_ASSISTANT)
  findOne(@Param('id') purchaseId: string) {
    return this.purchasesService.findOne(purchaseId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  update(
    @Param('id') purchaseId: string,
    @Body('OrderId') orderId: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(purchaseId, orderId, updatePurchaseDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.CHIEF_PHARMACIST)
  @Delete(':id')
  remove(@Param('id') purchaseId: string) {
    return this.purchasesService.remove(purchaseId);
  }
}
