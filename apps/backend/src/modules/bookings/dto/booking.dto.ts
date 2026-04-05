import {
  IsUUID,
  IsArray,
  IsDateString,
  IsString,
  Matches,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateBookingDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tableIds: string[];

  @IsUUID()
  restaurantId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  timeStart: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  guestsCount: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  estimatedDuration?: number;
}
