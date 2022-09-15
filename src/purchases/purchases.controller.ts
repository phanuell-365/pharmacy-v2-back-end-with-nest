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
} from '@nestjs/common';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(
    @Body('OrderId') orderId: string,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(orderId, createPurchaseDto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') purchaseId: string) {
    return this.purchasesService.findOne(purchaseId);
  }

  @Patch(':id')
  update(
    @Param('id') purchaseId: string,
    @Body('OrderId') orderId: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(orderId, purchaseId, updatePurchaseDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') purchaseId: string) {
    return this.purchasesService.remove(purchaseId);
  }
}
