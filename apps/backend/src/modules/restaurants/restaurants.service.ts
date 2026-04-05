import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantPhoto } from './entities/restaurant-photo.entity';
import { RestaurantUser, RestaurantUserRole } from './entities/restaurant-user.entity';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(RestaurantPhoto) private photosRepo: Repository<RestaurantPhoto>,
    @InjectRepository(RestaurantUser) private restaurantUsersRepo: Repository<RestaurantUser>,
  ) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 50) + '-' + Date.now();
  }

  async create(dto: CreateRestaurantDto, ownerId: string): Promise<Restaurant> {
    const restaurant = this.restaurantsRepo.create({
      ...dto,
      slug: this.slugify(dto.name),
    });
    await this.restaurantsRepo.save(restaurant);

    const ru = this.restaurantUsersRepo.create({
      user_id: ownerId,
      restaurant_id: restaurant.id,
      role: RestaurantUserRole.OWNER,
    });
    await this.restaurantUsersRepo.save(ru);

    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    const links = await this.restaurantUsersRepo.find({ where: { user_id: ownerId } });
    const ids = links.map((l) => l.restaurant_id);
    if (!ids.length) return [];
    return this.restaurantsRepo.findByIds(ids);
  }

  async findOne(id: string): Promise<Restaurant> {
    const r = await this.restaurantsRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Ресторан не найден');
    return r;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    await this.restaurantsRepo.update(id, dto);
    return this.findOne(id);
  }

  async addPhoto(restaurantId: string, url: string): Promise<RestaurantPhoto> {
    const photo = this.photosRepo.create({ restaurant_id: restaurantId, url });
    return this.photosRepo.save(photo);
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.photosRepo.delete(photoId);
  }

  async getPhotos(restaurantId: string): Promise<RestaurantPhoto[]> {
    return this.photosRepo.find({
      where: { restaurant_id: restaurantId },
      order: { sort_order: 'ASC' },
    });
  }
}
