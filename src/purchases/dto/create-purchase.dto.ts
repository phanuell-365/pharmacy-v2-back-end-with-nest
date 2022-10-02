import { IsDate, IsNotEmpty, IsNumber, IsUUID, MinDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePurchaseDto {
  @IsNotEmpty()
  @IsNumber()
  purchasePackSizeQuantity: number;

  @IsNotEmpty()
  @IsNumber()
  pricePerPackSize: number;

  @IsNotEmpty()
  @IsNumber()
  issueUnitPerPackSize: number;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  expiryDate: Date;

  @IsNotEmpty()
  @IsUUID()
  OrderId: string;
}
