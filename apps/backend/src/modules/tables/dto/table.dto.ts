import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { TableShape } from '../entities/table.entity';

export class CreateTableDto {
  @IsString()
  restaurant_id: string;

  @IsString()
  label: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsOptional()
  location_tag?: string;

  @IsNumber()
  @IsOptional()
  pos_x?: number;

  @IsNumber()
  @IsOptional()
  pos_y?: number;

  @IsEnum(TableShape)
  @IsOptional()
  shape?: TableShape;
}

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  location_tag?: string;

  @IsNumber()
  @IsOptional()
  pos_x?: number;

  @IsNumber()
  @IsOptional()
  pos_y?: number;

  @IsEnum(TableShape)
  @IsOptional()
  shape?: TableShape;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
