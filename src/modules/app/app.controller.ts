import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  info(): { name: string; status: 'running'; health: string } {
    return this.appService.info();
  }

  @Get('health')
  health(): { status: 'ok' } {
    return this.appService.health();
  }
}
