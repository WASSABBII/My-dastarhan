import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { RestaurantUser } from './entities/restaurant-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, RestaurantPhoto, RestaurantUser])],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
