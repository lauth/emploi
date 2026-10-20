import { Module } from '@nestjs/common';
import { OfferImagesModule } from '../offer-images/offer-images.module.js';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';

@Module({
  // Deleting an offer removes its image file (OfferImageStore).
  imports: [OfferImagesModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
