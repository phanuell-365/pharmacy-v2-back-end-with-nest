import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DoseForms } from '../enums';
import { MEDICINE_STRENGTHS } from '../constants';
import { IsValueContaining } from '../validations';

export class CreateMedicineDto {
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

  @IsNotEmpty()
  @IsString()
  packSize: string;
}
