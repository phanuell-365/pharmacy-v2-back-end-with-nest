import { IsNotEmpty, IsString } from 'class-validator';

export class IntervalQueryDto {
  @IsNotEmpty()
  @IsString()
  interval: 'this' | 'weekly';
}
