import type { JobAd } from '@emploi/shared';
import { Injectable } from '@nestjs/common';
import {
  jobAdUnreachable,
  jobAdUnreadable,
} from '../problems/problem.exception.js';
import { extractJobAd } from './job-ad-extractor.js';
import { PageFetchError, PageFetcher } from './page-fetcher.js';

/** Reads job ads from their link (adrs/0032-fetch-job-ad.md); saves nothing. */
@Injectable()
export class JobAdsService {
  constructor(private readonly fetcher: PageFetcher) {}

  async fetch(url: string): Promise<JobAd> {
    let page;
    try {
      page = await this.fetcher.fetch(url);
    } catch (error) {
      throw error instanceof PageFetchError
        ? jobAdUnreachable(error.message)
        : error;
    }
    const ad = extractJobAd(page.html, page.url);
    if (ad === null) {
      throw jobAdUnreadable();
    }
    return ad;
  }
}
