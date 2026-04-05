import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
  ) {}

  async getByToken(token: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { cancel_token: token },
      relations: ['restaurant'],
    });
    if (!booking) throw new NotFoundException('Бронирование не найдено');
    return {
      restaurantName: booking.restaurant.name,
      restaurantSlug: booking.restaurant.slug,
      date: booking.date,
      guestsCount: booking.guests_count,
    };
  }

  async submitReview(token: string, rating: number, comment?: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { cancel_token: token },
      relations: ['restaurant'],
    });
    if (!booking) throw new NotFoundException('Бронирование не найдено');

    const existing = await this.reviewsRepo.findOne({ where: { booking_id: booking.id } });
    if (existing) throw new ConflictException('Отзыв уже оставлен');

    const review = this.reviewsRepo.create({
      booking_id: booking.id,
      restaurant_id: booking.restaurant_id,
      rating,
      comment,
    });
    return this.reviewsRepo.save(review);
  }

  async getByRestaurant(restaurantId: string) {
    return this.reviewsRepo.find({
      where: { restaurant_id: restaurantId },
      relations: ['booking', 'booking.client'],
      order: { created_at: 'DESC' },
    });
  }
}
