import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@Controller('v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async stats(@CurrentUser() user: RequestUser) {
    const data = await this.dashboardService.getDashboardStats(user.id);
    return { success: true, data };
  }

  @Get('activity')
  async activity(@CurrentUser() user: RequestUser) {
    const data = await this.dashboardService.getRecentActivity(user.id);
    return { success: true, data };
  }
}
