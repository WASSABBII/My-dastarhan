import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/restaurant')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private service: RestaurantsService) {}

  @Get()
  getMyRestaurants(@Request() req) {
    return this.service.findByOwner(req.user.id);
  }

  @Post()
  create(@Body() dto: CreateRestaurantDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/photos')
  getPhotos(@Param('id') id: string) {
    return this.service.getPhotos(id);
  }

  @Post(':id/photos')
  addPhoto(@Param('id') id: string, @Body('url') url: string) {
    return this.service.addPhoto(id, url);
  }

  @Delete('photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return this.service.deletePhoto(photoId);
  }
}
