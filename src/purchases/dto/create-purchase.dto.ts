import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreatePurchaseDto {
  @IsNotEmpty()
  @IsNumber()
  packSizeQuantity: number;

  @IsNotEmpty()
  @IsNumber()
  pricePerPackSize: number;

  @IsNotEmpty()
  @IsUUID()
  OrderId: string;
}
