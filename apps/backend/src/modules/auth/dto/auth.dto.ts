import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SendOtpDto {
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}

export class UpdateClientProfileDto {
  @IsString()
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterRestaurantDto {
  // Ресторан
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  cuisine_type: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsOptional()
  working_hours?: Record<string, string>;

  // Владелец
  @IsEmail()
  email: string;

  @IsString()
  contact_person: string;

  @IsString()
  @MinLength(6)
  password: string;
}
