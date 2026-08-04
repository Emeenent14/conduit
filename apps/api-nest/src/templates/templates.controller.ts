import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('v1/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Query() query: Record<string, string>) {
    const { templates, meta } = await this.templatesService.list(query);
    return { success: true, data: templates, meta };
  }

  @Get('categories')
  async categories() {
    const data = await this.templatesService.listCategories();
    return { success: true, data };
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('slug') slug: string) {
    const data = await this.templatesService.findBySlug(slug);
    return { success: true, data };
  }
}
