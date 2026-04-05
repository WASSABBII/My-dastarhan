import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private service: TablesService) {}

  @Get()
  findAll(@Query('restaurantId') restaurantId: string) {
    return this.service.findByRestaurant(restaurantId);
  }

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
