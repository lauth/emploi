import { Module } from '@nestjs/common';
import { JobAdsController } from './job-ads.controller.js';
import { JobAdsService } from './job-ads.service.js';
import { PageFetcher } from './page-fetcher.js';

@Module({
  controllers: [JobAdsController],
  providers: [JobAdsService, PageFetcher],
})
export class JobAdsModule {}
