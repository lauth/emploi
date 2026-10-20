import type { Readable } from 'node:stream';
import type { OfferImage, OfferImageType } from '@emploi/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  offerImageNotFound,
  offerNotFound,
  unsupportedImage,
} from '../problems/problem.exception.js';
import { detectImageType, toOfferImageType } from './offer-image-format.js';
import { toOfferImage } from './offer-image.mapper.js';
import { OfferImageStore } from './offer-image-store.js';

/** Prisma error code: a foreign key points to no row (here: no such offer). */
const FOREIGN_KEY_VIOLATION = 'P2003';

/** The columns of an image that offers show. */
export const OFFER_IMAGE_INFO = {
  contentType: true,
  byteSize: true,
  updatedAt: true,
} as const satisfies Prisma.OfferImageSelect;

/** An image's bytes and format, to send back. */
export interface OfferImageContent {
  contentType: OfferImageType;
  byteSize: number;
  stream: Readable;
}

/**
 * The image of an offer (adrs/0031-offer-image.md): its description in the
 * database, its bytes in the store.
 */
@Injectable()
export class OfferImagesService {
  private readonly logger = new Logger(OfferImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: OfferImageStore,
  ) {}

  /**
   * Sets or replaces the image; its format comes from the bytes. The file is
   * staged first and only put in place once the database accepted it (the
   * offer exists), so a failure leaves the previous image whole.
   */
  async put(offerId: string, data: Uint8Array): Promise<OfferImage> {
    const contentType = detectImageType(data);
    if (contentType === null) {
      throw unsupportedImage();
    }
    const staged = await this.store.stage(offerId, data);
    try {
      const values = { contentType, byteSize: data.length };
      const saved = await this.prisma.offerImage.upsert({
        where: { offerId },
        create: { offerId, ...values },
        update: values,
        select: OFFER_IMAGE_INFO,
      });
      await staged.commit();
      return toOfferImage(saved);
    } catch (error) {
      await staged.discard();
      throw error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === FOREIGN_KEY_VIOLATION
        ? offerNotFound(offerId)
        : error;
    }
  }

  async get(offerId: string): Promise<OfferImageContent> {
    const image = await this.prisma.offerImage.findUnique({
      where: { offerId },
      select: { contentType: true, byteSize: true },
    });
    if (image === null) {
      throw await this.notFound(offerId);
    }
    const stream = await this.store.read(offerId);
    if (stream === null) {
      // Described but gone from the volume, e.g. a database restored without
      // its images.
      this.logger.error(`The image file of offer ${offerId} is missing`);
      throw offerImageNotFound(offerId);
    }
    return {
      contentType: toOfferImageType(image.contentType),
      byteSize: image.byteSize,
      stream,
    };
  }

  async remove(offerId: string): Promise<void> {
    const { count } = await this.prisma.offerImage.deleteMany({
      where: { offerId },
    });
    if (count === 0) {
      throw await this.notFound(offerId);
    }
    await this.store.remove(offerId);
  }

  /** No image: say whether the offer itself is missing. */
  private async notFound(offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      select: { id: true },
    });
    return offer === null
      ? offerNotFound(offerId)
      : offerImageNotFound(offerId);
  }
}
