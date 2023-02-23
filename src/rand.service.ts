import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class RandService {
  // Linear congruential generator parameters:
  private readonly a: number;
  private readonly c: number;
  private readonly m: number;
  private lastSeed: number;
  // list of numbers that were not yet returned to user.
  private unusedNumbers: string[];
  private readonly min: number;
  private readonly max: number;

  constructor(
    configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.a = +configService.get('LCG_A');
    this.c = +configService.get('LCG_C');
    this.m = +configService.get('LCG_M');

    this.min = +configService.get('MIN');
    this.max = +configService.get('MAX');
    this.lastSeed = null;
  }

  async resetGenerator() {
    const resetGeneratorParams = this.redis.pipeline();
    // resetGeneratorParams.del('unused_numbers');
    resetGeneratorParams.del('last_seed');
    // prepopulate list of unused numbers with configured sequence min..max
    this.unusedNumbers = [...Array(this.max - this.min + 1).keys()].map((key) =>
      String(+key + this.min),
    );
    // storing long lists in redis is very slow and the spread operator fails for wide ranges
    // resetGeneratorParams.rpush('unused_numbers', ...this.unusedNumbers);
    await resetGeneratorParams.exec();
    return 'reset successful';
  }

  async getRandomNumberWithoutRepetion() {
    // this.unusedNumbers = await this.redis.lrange('unused_numbers', 0, -1);
    if (this.unusedNumbers.length === 0) {
      return 'no numbers left.';
    }

    const randomIndex = await this.getRandomNumber(
      0,
      this.unusedNumbers.length - 1,
    );
    const randomNumber = this.unusedNumbers[randomIndex];

    // remove used number from list of unused numbers (much faster than Array.splice):
    this.unusedNumbers[randomIndex] =
      this.unusedNumbers[this.unusedNumbers.length - 1];
    this.unusedNumbers.length -= 1;
    // this.unusedNumbers.splice(randomIndex, 1);

    // update list of unused numbers - this was terribly slow
    // const replaceUnusedNumbers = this.redis.pipeline();
    // replaceUnusedNumbers.del('unused_numbers');
    // if (this.unusedNumbers.length) {
    //   replaceUnusedNumbers.rpush('unused_numbers', ...this.unusedNumbers);
    // }
    // replaceUnusedNumbers.exec();

    return randomNumber;
  }

  async getRandomNumber(min: number, max: number): Promise<number> {
    if (this.lastSeed === null) {
      this.lastSeed = +(
        (await this.redis.get('last_seed')) ?? new Date().getMilliseconds()
      );
    }

    // Linear congruential generator function:
    this.lastSeed = (this.a * this.lastSeed + this.c) % this.m;
    this.redis.set('last_seed', this.lastSeed);
    return min + (this.lastSeed % (max - min + 1));
  }

  // generate all numbers from configured range
  async test() {
    for (let i = this.min; i < this.max; i++) {
      await this.getRandomNumberWithoutRepetion();
    }
  }
}
