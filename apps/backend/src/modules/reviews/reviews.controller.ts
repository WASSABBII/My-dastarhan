import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SubmitReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

@Controller('review')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Get(':token')
  getByToken(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Post(':token')
  submitReview(@Param('token') token: string, @Body() dto: SubmitReviewDto) {
    return this.service.submitReview(token, dto.rating, dto.comment);
  }
}

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard)
export class AdminReviewsController {
  constructor(private service: ReviewsService) {}

  @Get()
  getByRestaurant(@Query('restaurantId') restaurantId: string) {
    return this.service.getByRestaurant(restaurantId);
  }
}
