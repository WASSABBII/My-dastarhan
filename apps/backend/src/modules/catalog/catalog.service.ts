import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantPhoto } from '../restaurants/entities/restaurant-photo.entity';
import { MenuCategory } from '../menu/entities/menu-category.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { AvailabilityService } from '../bookings/availability.service';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(RestaurantPhoto) private photosRepo: Repository<RestaurantPhoto>,
    @InjectRepository(MenuCategory) private categoriesRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem) private itemsRepo: Repository<MenuItem>,
    private availabilityService: AvailabilityService,
  ) {}

  async getCatalog(filters: { cuisine?: string; district?: string; page?: number }) {
    const page = filters.page || 1;
    const limit = 12;
    const qb = this.restaurantsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.photos', 'p')
      .where("r.status != 'blocked'");

    if (filters.cuisine) {
      qb.andWhere('r.cuisine_type = :cuisine', { cuisine: filters.cuisine });
    }
    if (filters.district) {
      qb.andWhere('r.district = :district', { district: filters.district });
    }

    qb.orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, total } };
  }

  async getBySlug(slug: string) {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug },
      relations: ['photos'],
    });
    if (!restaurant) throw new NotFoundException('Ресторан не найден');
    return { data: restaurant };
  }

  async getAvailability(slug: string, date: string, time: string, duration?: number) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { slug } });
    if (!restaurant) throw new NotFoundException('Ресторан не найден');
    const tables = await this.availabilityService.getAvailableTables(
      restaurant.id,
      date,
      time,
      duration || 90,
    );
    return { data: tables };
  }

  async getMenu(slug: string) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { slug } });
    if (!restaurant) throw new NotFoundException('Ресторан не найден');
    const categories = await this.categoriesRepo.find({
      where: { restaurant_id: restaurant.id, is_active: true },
      order: { sort_order: 'ASC' },
    });
    const categoriesWithItems = await Promise.all(
      categories.map(async (cat) => {
        const items = await this.itemsRepo.find({
          where: { category_id: cat.id, is_available: true },
        });
        return { ...cat, items };
      }),
    );
    return { data: categoriesWithItems };
  }
}
