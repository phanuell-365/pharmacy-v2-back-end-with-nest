import { PartialType } from '@nestjs/mapped-types';
import { CreateStockDto } from './create-stock.dto';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @IsOptional()
  @IsNumber()
  issueUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  issueUnitPerPackSize?: number;

  @IsOptional()
  @IsString()
  packSize?: string;

  @IsOptional()
  @IsNumber()
  packSizePrice?: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  expirationDate?: Date;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;
}
