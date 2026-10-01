import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  info(): { name: string; status: 'running'; health: string } {
    return {
      name: 'devops-test-task',
      status: 'running',
      health: '/health',
    };
  }

  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
