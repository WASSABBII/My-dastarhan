import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';

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
}
