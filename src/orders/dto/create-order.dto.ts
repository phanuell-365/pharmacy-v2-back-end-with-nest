import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { OrderStatuses } from '../enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  orderQuantity: number;

  @IsOptional()
  @IsEnum(OrderStatuses, {
    message: 'Status is not valid',
  })
  status: OrderStatuses;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;

  @IsNotEmpty()
  @IsUUID()
  SupplierId: string;
}
