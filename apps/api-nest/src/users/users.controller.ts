import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@Controller('v1/user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: RequestUser) {
    const data = await this.usersService.getProfile(user.id);
    return { success: true, data: { user: data } };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.usersService.updateProfile(user.id, body);
    return { success: true, data: { user: data } };
  }
}
