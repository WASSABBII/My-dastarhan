import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

@Injectable()
export class TablesService {
  constructor(@InjectRepository(Table) private tablesRepo: Repository<Table>) {}

  async findByRestaurant(restaurantId: string): Promise<Table[]> {
    return this.tablesRepo.find({
      where: { restaurant_id: restaurantId, is_active: true },
    });
  }

  async create(dto: CreateTableDto): Promise<Table> {
    const table = this.tablesRepo.create(dto);
    return this.tablesRepo.save(table);
  }

  async update(id: string, dto: UpdateTableDto): Promise<Table> {
    await this.tablesRepo.update(id, dto);
    const table = await this.tablesRepo.findOne({ where: { id } });
    if (!table) throw new NotFoundException('Столик не найден');
    return table;
  }

  async remove(id: string): Promise<void> {
    await this.tablesRepo.update(id, { is_active: false });
  }
}
