import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseDto } from './create-purchase.dto';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MinDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @IsOptional()
  @IsNumber()
  packSizeQuantity?: number;

  @IsOptional()
  @IsNumber()
  pricePerPackSize?: number;

  @IsOptional()
  @IsNumber()
  issueUnitPerPackSize?: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  expiryDate?: Date;

  @IsNotEmpty()
  @IsUUID()
  OrderId: string;
}
