import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicineDto } from './create-medicine.dto';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DoseForms } from '../enums';
import { IsValueContaining } from '../validations';
import { MEDICINE_STRENGTHS } from '../constants';

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(DoseForms, {
    message: 'Invalid dose form',
  })
  @IsNotEmpty()
  readonly doseForm: DoseForms;

  @IsString()
  @IsValueContaining(MEDICINE_STRENGTHS, {
    message: 'Invalid medicine strength',
  })
  @IsNotEmpty()
  strength: string;

  @IsNotEmpty()
  @IsNumber()
  levelOfUse: number;

  @IsNotEmpty()
  @IsString()
  therapeuticClass: string;
}
