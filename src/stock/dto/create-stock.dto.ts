import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MinDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStockDto {
  @IsNumber()
  @IsNotEmpty()
  issueUnitPrice: number;

  @IsNumber()
  @IsNotEmpty()
  issueUnitPerPackSize: number;

  @IsNotEmpty()
  @IsString()
  packSize: string;

  @IsNumber()
  @IsNotEmpty()
  packSizePrice: number;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  expirationDate: Date;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;
}
