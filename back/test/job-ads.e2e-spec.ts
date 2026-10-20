import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PageFetchError, PageFetcher } from '../src/job-ads/page-fetcher.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const URL = 'https://jobs.example.com/42';

const AD_PAGE = `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({
  '@type': 'JobPosting',
  title: 'Développeur backend',
  hiringOrganization: { name: 'Acme' },
  jobLocation: { address: { addressLocality: 'Lyon' } },
  description: '<p>Missions</p><ul><li>API</li></ul>',
})}</script></head><body></body></html>`;

describe('Job ads (e2e)', () => {
  const fetcher = { fetch: vi.fn() };
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $disconnect: vi.fn() })
      .overrideProvider(PageFetcher)
      .useValue(fetcher)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function fetchAd(body: object) {
    return request(app.getHttpServer()).post('/job-ads/fetch').send(body);
  }

  it('reads the ad of the page, after redirects', async () => {
    fetcher.fetch.mockResolvedValue({
      url: `${URL}?ref=redirect`,
      html: AD_PAGE,
    });

    const response = await fetchAd({ url: `  ${URL} ` }).expect(200);

    expect(response.body).toEqual({
      url: `${URL}?ref=redirect`,
      title: 'Développeur backend',
      company: 'Acme',
      location: 'Lyon',
      description: 'Missions\n\n• API',
    });
    expect(fetcher.fetch).toHaveBeenCalledWith(URL);
  });

  it('says why a page could not be fetched', async () => {
    fetcher.fetch.mockRejectedValue(
      new PageFetchError('the site answered HTTP 403'),
    );

    const response = await fetchAd({ url: URL }).expect(502);

    expect(response.body).toMatchObject({
      type: '/problems/job-ad-unreachable',
      detail:
        'The page of the job ad could not be fetched: the site answered HTTP 403.',
    });
  });

  it('answers 422 when the page holds nothing readable', async () => {
    fetcher.fetch.mockResolvedValue({ url: URL, html: '<div id="app"></div>' });

    const response = await fetchAd({ url: URL }).expect(422);

    expect(response.body).toMatchObject({
      type: '/problems/job-ad-unreadable',
    });
  });

  it.each([
    [{}, 'isUrl'],
    [{ url: 'javascript:alert(1)' }, 'isUrl'],
    [{ url: 'ftp://example.com/ad' }, 'isUrl'],
    [{ url: URL, extra: true }, 'whitelistValidation'],
  ])('refuses %j', async (body, code) => {
    const response = await fetchAd(body).expect(400);

    expect(response.body).toMatchObject({
      type: '/problems/validation-error',
      errors: expect.arrayContaining([
        expect.objectContaining({ code }),
      ]) as unknown,
    });
    expect(fetcher.fetch).not.toHaveBeenCalled();
  });
});
