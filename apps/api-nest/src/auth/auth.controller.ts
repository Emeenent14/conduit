import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { loginSchema, refreshSchema, registerSchema } from './dto/auth.schemas';
import type { LoginDto, RefreshDto, RegisterDto } from './dto/auth.schemas';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterDto, @Req() req: Request) {
    const data = await this.authService.register(body, {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    return { success: true, data };
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const data = await this.authService.login(body, {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    return { success: true, data };
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshSchema))
  async refresh(@Body() body: RefreshDto) {
    const data = await this.authService.refresh(body.refreshToken);
    return { success: true, data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: RequestUser) {
    const data = await this.authService.logout(user.id);
    return { success: true, data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    const data = await this.authService.me(user.id);
    return { success: true, data };
  }
}
