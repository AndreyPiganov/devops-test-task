import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return application info', () => {
      expect(appController.info()).toEqual({
        name: 'devops-test-task',
        status: 'running',
        health: '/health',
      });
    });

    it('should return an ok status', () => {
      expect(appController.health()).toEqual({ status: 'ok' });
    });
  });
});
