import { Controller, Post, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, UpdateClientProfileDto, LoginDto, RegisterRestaurantDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ClientAuthGuard } from './guards/client-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // OTP — для клиентов
  @Post('client/otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('client/otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Patch('client/profile')
  @UseGuards(ClientAuthGuard)
  updateProfile(@Request() req, @Body() dto: UpdateClientProfileDto) {
    return this.authService.updateClientProfile(req.user.id, dto.name);
  }

  // Email+Password — для users
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return req.user;
  }

  @Post('restaurant/register')
  registerRestaurant(@Body() dto: RegisterRestaurantDto) {
    return this.authService.registerRestaurant(dto);
  }
}
