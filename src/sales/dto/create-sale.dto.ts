import { SalesStatus } from '../enums';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsNumber()
  issueUnitQuantity: number;

  @IsOptional()
  @IsEnum(SalesStatus, {
    message: 'Invalid status',
  })
  status?: SalesStatus;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;

  @IsNotEmpty()
  @IsUUID()
  CustomerId: string;
}
