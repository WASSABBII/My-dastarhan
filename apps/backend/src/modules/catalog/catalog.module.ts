import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantPhoto } from '../restaurants/entities/restaurant-photo.entity';
import { MenuCategory } from '../menu/entities/menu-category.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, RestaurantPhoto, MenuCategory, MenuItem]),
    BookingsModule,
  ],
  providers: [CatalogService],
  controllers: [CatalogController],
})
export class CatalogModule {}
