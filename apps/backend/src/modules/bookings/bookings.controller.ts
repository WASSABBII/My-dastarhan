import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get('cancel/:token')
  getByToken(@Param('token') token: string) {
    return this.bookingsService.getByToken(token);
  }

  @Post('cancel/:token')
  cancelByToken(@Param('token') token: string) {
    return this.bookingsService.cancelByToken(token);
  }

  @UseGuards(ClientAuthGuard)
  @Post()
  create(@Body() dto: CreateBookingDto, @Request() req: any) {
    return this.bookingsService.createBooking(dto, req.user.id);
  }

  @UseGuards(ClientAuthGuard)
  @Get('my')
  getMyBookings(@Request() req: any) {
    return this.bookingsService.findMyBookings(req.user.id);
  }

  @UseGuards(ClientAuthGuard)
  @Delete(':id/cancel')
  cancelByAuth(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.cancelByAuth(id, req.user.id);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  getAdminBookings(
    @Query('restaurantId') restaurantId: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getByRestaurantAndDate(restaurantId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status);
  }
}
