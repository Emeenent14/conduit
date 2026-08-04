import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Controller('health')
export class HealthController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.nodeEnv,
    };
  }
}
