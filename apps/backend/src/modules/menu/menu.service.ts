import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CreateCategoryDto, UpdateCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory) private categoriesRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem) private itemsRepo: Repository<MenuItem>,
  ) {}

  async getMenu(restaurantId: string) {
    const categories = await this.categoriesRepo.find({
      where: { restaurant_id: restaurantId, is_active: true },
      order: { sort_order: 'ASC' },
    });
    const result = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        items: await this.itemsRepo.find({
          where: { category_id: cat.id, is_available: true },
        }),
      })),
    );
    return result;
  }

  async createCategory(dto: CreateCategoryDto): Promise<MenuCategory> {
    const cat = this.categoriesRepo.create(dto);
    return this.categoriesRepo.save(cat);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<MenuCategory> {
    await this.categoriesRepo.update(id, dto);
    const cat = await this.categoriesRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Категория не найдена');
    return cat;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoriesRepo.delete(id);
  }

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const item = this.itemsRepo.create(dto);
    return this.itemsRepo.save(item);
  }

  async updateItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    await this.itemsRepo.update(id, dto);
    const item = await this.itemsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Блюдо не найдено');
    return item;
  }

  async deleteItem(id: string): Promise<void> {
    await this.itemsRepo.delete(id);
  }
}
