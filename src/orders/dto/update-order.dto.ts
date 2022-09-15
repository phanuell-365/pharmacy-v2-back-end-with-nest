import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { OrderStatuses } from '../enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsNumber()
  orderQuantity?: number;

  @IsOptional()
  @IsEnum(OrderStatuses, {
    message: 'Status is not valid',
  })
  status?: OrderStatuses;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;

  @IsNotEmpty()
  @IsUUID()
  SupplierId: string;
}
