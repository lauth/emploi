import { Module } from '@nestjs/common';
import { OfferImageStore } from './offer-image-store.js';
import { OfferImagesController } from './offer-images.controller.js';
import { OfferImagesService } from './offer-images.service.js';

@Module({
  controllers: [OfferImagesController],
  providers: [OfferImagesService, OfferImageStore],
  // Deleting an offer removes its image file too.
  exports: [OfferImageStore],
})
export class OfferImagesModule {}
