import { IsDate, IsNotEmpty, MaxDate, MinDate } from 'class-validator';
import { Transform } from 'class-transformer';
import * as moment from 'moment';

export class DateQueryDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(moment().subtract(1, 'year').toDate())
  @MaxDate(moment().toDate())
  s: Date;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MaxDate(moment().add(10, 'minute').toDate())
  e: Date;
}
