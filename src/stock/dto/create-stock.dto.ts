import { IsDate, IsNotEmpty, IsString, IsUUID, MinDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStockDto {
  @IsNotEmpty()
  @IsString()
  packSize: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  expiryDate: Date;

  @IsNotEmpty()
  @IsUUID()
  MedicineId: string;
}
