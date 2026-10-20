import type { JobAd } from '@emploi/shared';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInvalidRequest, ApiJobAdFailures } from '../common/api-docs.js';
import { FetchJobAdDto } from './dto/fetch-job-ad.dto.js';
import { JobAdDto } from './dto/job-ad.dto.js';
import { JobAdsService } from './job-ads.service.js';

/** Reading a job ad from its link (adrs/0032-fetch-job-ad.md). */
@ApiTags('job-ads')
@Controller('job-ads')
export class JobAdsController {
  constructor(private readonly jobAds: JobAdsService) {}

  @Post('fetch')
  // Nothing is created: the answer is what the page says.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a job ad from its link and read it',
    description:
      'Fetches the page (one request, like a browser opening the link; private and local addresses are refused) and reads its schema.org JobPosting, or else its title and main text. Saves nothing: use the result to fill an offer.',
  })
  @ApiOkResponse({ type: JobAdDto })
  @ApiInvalidRequest()
  @ApiJobAdFailures()
  fetch(@Body() body: FetchJobAdDto): Promise<JobAd> {
    return this.jobAds.fetch(body.url);
  }
}
