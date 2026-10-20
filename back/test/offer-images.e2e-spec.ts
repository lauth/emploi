import { existsSync } from 'node:fs';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { OFFER_IMAGE_MAX_BYTES } from '../src/offer-images/offer-image-format.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const PATH = `/offers/${ID}/image`;

/** Set by vitest.config.e2e.ts: a fresh temporary directory. */
const IMAGES_DIR = process.env.IMAGES_DIR ?? '';
const FILE = join(IMAGES_DIR, ID);

/** A PNG signature followed by some bytes: enough to be recognised. */
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const UPDATED_AT = new Date('2026-10-20T10:00:00.000Z');

describe('Offer images (e2e)', () => {
  const prisma = {
    offer: { findUnique: vi.fn() },
    offerImage: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.resetAllMocks();
    await rm(FILE, { force: true });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  /** No staged file left behind. */
  async function expectNoTemporaryFile() {
    expect(
      (await readdir(IMAGES_DIR)).filter((name) => name.endsWith('.tmp')),
    ).toEqual([]);
  }

  function upload(body: Buffer = PNG) {
    return request(app.getHttpServer())
      .put(PATH)
      .set('Content-Type', 'image/png')
      .send(body);
  }

  describe('PUT /offers/:offerId/image', () => {
    it('writes the file and describes it in the database', async () => {
      prisma.offerImage.upsert.mockResolvedValue({
        contentType: 'image/png',
        byteSize: PNG.length,
        updatedAt: UPDATED_AT,
      });

      const response = await request(app.getHttpServer())
        .put(PATH)
        // The declared type is not trusted: the bytes say PNG.
        .set('Content-Type', 'image/jpeg')
        .send(PNG)
        .expect(200);

      expect(response.body).toEqual({
        contentType: 'image/png',
        byteSize: PNG.length,
        updatedAt: '2026-10-20T10:00:00.000Z',
      });
      const values = { contentType: 'image/png', byteSize: PNG.length };
      expect(prisma.offerImage.upsert).toHaveBeenCalledWith({
        where: { offerId: ID },
        create: { offerId: ID, ...values },
        update: values,
        select: { contentType: true, byteSize: true, updatedAt: true },
      });
      await expect(readFile(FILE)).resolves.toEqual(PNG);
      await expectNoTemporaryFile();
    });

    it('refuses what is not an accepted image', async () => {
      const response = await request(app.getHttpServer())
        .put(PATH)
        .set('Content-Type', 'image/svg+xml')
        .send(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))
        .expect(415);

      expect(response.body).toMatchObject({
        type: '/problems/unsupported-image',
        status: 415,
      });
      expect(prisma.offerImage.upsert).not.toHaveBeenCalled();
      expect(existsSync(FILE)).toBe(false);
    });

    it('refuses an empty or JSON body', async () => {
      await request(app.getHttpServer())
        .put(PATH)
        .send({ image: 'data' })
        .expect(415);
    });

    it('refuses an image over the limit', async () => {
      const big = Buffer.alloc(OFFER_IMAGE_MAX_BYTES + 1);
      PNG.copy(big);

      const response = await upload(big).expect(413);

      expect(response.headers['content-type']).toMatch(
        /^application\/problem\+json/,
      );
      expect(response.body).toMatchObject({
        type: '/problems/image-too-large',
      });
      expect(prisma.offerImage.upsert).not.toHaveBeenCalled();
      expect(existsSync(FILE)).toBe(false);
    });

    it('answers 404 and keeps no file when the offer does not exist', async () => {
      prisma.offerImage.upsert.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Foreign key', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      const response = await upload().expect(404);

      expect(response.body).toMatchObject({ resource: 'offer' });
      expect(existsSync(FILE)).toBe(false);
      await expectNoTemporaryFile();
    });

    it('refuses an offer id that is not a UUID', async () => {
      await request(app.getHttpServer())
        .put('/offers/42/image')
        .set('Content-Type', 'image/png')
        .send(PNG)
        .expect(400);
    });
  });

  describe('GET /offers/:offerId/image', () => {
    it('streams the file with its type', async () => {
      prisma.offerImage.upsert.mockResolvedValue({
        contentType: 'image/png',
        byteSize: PNG.length,
        updatedAt: UPDATED_AT,
      });
      await upload().expect(200);
      prisma.offerImage.findUnique.mockResolvedValue({
        contentType: 'image/png',
        byteSize: PNG.length,
      });

      const response = await request(app.getHttpServer())
        .get(PATH)
        .buffer(true)
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-length']).toBe(String(PNG.length));
      expect(response.headers['cache-control']).toBe('private, no-cache');
      expect(Buffer.from(response.body as Buffer)).toEqual(PNG);
    });

    it('tells a missing image from a missing offer', async () => {
      prisma.offerImage.findUnique.mockResolvedValue(null);
      prisma.offer.findUnique.mockResolvedValueOnce({ id: ID });

      const noImage = await request(app.getHttpServer()).get(PATH).expect(404);
      expect(noImage.body).toMatchObject({
        type: '/problems/resource-not-found',
        resource: 'offer-image',
      });

      prisma.offer.findUnique.mockResolvedValueOnce(null);
      const noOffer = await request(app.getHttpServer()).get(PATH).expect(404);
      expect(noOffer.body).toMatchObject({ resource: 'offer' });
    });

    it('answers 404 when the file is gone from the volume', async () => {
      prisma.offerImage.findUnique.mockResolvedValue({
        contentType: 'image/png',
        byteSize: PNG.length,
      });

      const response = await request(app.getHttpServer()).get(PATH).expect(404);

      expect(response.body).toMatchObject({ resource: 'offer-image' });
    });
  });

  describe('DELETE /offers/:offerId/image', () => {
    it('removes the description and the file', async () => {
      prisma.offerImage.upsert.mockResolvedValue({
        contentType: 'image/png',
        byteSize: PNG.length,
        updatedAt: UPDATED_AT,
      });
      await upload().expect(200);
      prisma.offerImage.deleteMany.mockResolvedValue({ count: 1 });

      await request(app.getHttpServer()).delete(PATH).expect(204);

      expect(prisma.offerImage.deleteMany).toHaveBeenCalledWith({
        where: { offerId: ID },
      });
      expect(existsSync(FILE)).toBe(false);
    });

    it('answers 404 when there is no image', async () => {
      prisma.offerImage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.offer.findUnique.mockResolvedValue({ id: ID });

      const response = await request(app.getHttpServer())
        .delete(PATH)
        .expect(404);

      expect(response.body).toMatchObject({ resource: 'offer-image' });
    });
  });
});
