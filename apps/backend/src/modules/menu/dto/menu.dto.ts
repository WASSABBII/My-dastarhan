import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsUUID()
  restaurant_id: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  sort_order?: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class CreateMenuItemDto {
  @IsUUID()
  category_id: string;

  @IsUUID()
  restaurant_id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsArray()
  @IsOptional()
  allergens?: string[];
}

export class UpdateMenuItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  allergens?: string[];

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;
}
