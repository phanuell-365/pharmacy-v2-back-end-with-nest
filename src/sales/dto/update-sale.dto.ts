import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDto } from './create-sale.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { SalesStatus } from '../enums';

export class UpdateSaleDto extends PartialType(CreateSaleDto) {
  @IsOptional()
  @IsNumber()
  issueUnitQuantity?: number;

  @IsOptional()
  @IsEnum(SalesStatus, {
    message: 'Invalid status',
  })
  status?: SalesStatus;

  @IsOptional()
  @IsNumber()
  amountReceived?: number;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;

  @IsNotEmpty()
  @IsUUID()
  CustomerId: string;
}
