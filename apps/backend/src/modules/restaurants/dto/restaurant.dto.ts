import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  cuisine_type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  operator_phone?: string;
}

export class UpdateRestaurantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cuisine_type?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  operator_phone?: string;

  @IsOptional()
  working_hours?: Record<string, string>;

  @IsNumber()
  @IsOptional()
  buffer_minutes?: number;

  @IsBoolean()
  @IsOptional()
  deposit_required?: boolean;

  @IsNumber()
  @IsOptional()
  deposit_amount?: number;
}
