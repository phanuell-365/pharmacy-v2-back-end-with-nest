import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicineDto } from './create-medicine.dto';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DoseForms } from '../enums';
import { IsValueContaining } from '../validations';
import { MEDICINE_STRENGTHS } from '../constants';

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(DoseForms, {
    message: 'Invalid dose form',
  })
  @IsOptional()
  readonly doseForm?: DoseForms;

  @IsString()
  @IsValueContaining(MEDICINE_STRENGTHS, {
    message: 'Invalid medicine strength',
  })
  @IsOptional()
  strength?: string;

  @IsOptional()
  @IsNumber()
  levelOfUse?: number;

  @IsOptional()
  @IsString()
  therapeuticClass?: string;

  @IsOptional()
  @IsString()
  packSize?: string;
}
