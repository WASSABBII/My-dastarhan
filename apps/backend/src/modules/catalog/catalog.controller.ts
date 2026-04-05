import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get()
  getCatalog(
    @Query('cuisine') cuisine?: string,
    @Query('district') district?: string,
    @Query('page') page?: string,
  ) {
    return this.catalogService.getCatalog({
      cuisine,
      district,
      page: page ? +page : 1,
    });
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.catalogService.getBySlug(slug);
  }

  @Get(':slug/availability')
  getAvailability(
    @Param('slug') slug: string,
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('duration') duration?: string,
  ) {
    return this.catalogService.getAvailability(
      slug,
      date,
      time,
      duration ? +duration : undefined,
    );
  }

  @Get(':slug/menu')
  getMenu(@Param('slug') slug: string) {
    return this.catalogService.getMenu(slug);
  }
}
