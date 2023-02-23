import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RandService } from './rand.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private randService: RandService,
  ) {}

  @Get('/reset')
  async resetGenerator() {
    return await this.randService.resetGenerator();
  }

  @Get()
  async getRandomNumber() {
    return this.randService.getRandomNumberWithoutRepetion();
  }

  @Get('test')
  async testGenerator() {
    await this.randService.resetGenerator();
    const start = Date.now();
    await this.randService.test();
    const duration = Date.now() - start;
    console.log(`Execution time: ${duration} ms`);
    return duration;
  }
}
