import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseDto } from './create-purchase.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @IsOptional()
  @IsNumber()
  packSizeQuantity?: number;

  @IsOptional()
  @IsNumber()
  pricePerPackSize?: number;

  @IsNotEmpty()
  @IsUUID()
  OrderId: string;
}
