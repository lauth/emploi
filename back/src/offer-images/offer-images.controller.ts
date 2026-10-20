import type { IncomingMessage } from 'node:http';
import type { OfferImage } from '@emploi/shared';
import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiImageRejected,
  ApiInvalidRequest,
  ApiNotFound,
} from '../common/api-docs.js';
import { ParseIdPipe } from '../problems/validation.js';
import { OfferImageDto } from './offer-image.dto.js';
import {
  OFFER_IMAGE_MAX_BYTES,
  OFFER_IMAGE_TYPES,
} from './offer-image-format.js';
import { OfferImagesService } from './offer-images.service.js';
import { readBody } from './read-body.js';

const OFFER_ID = ApiParam({
  name: 'offerId',
  format: 'uuid',
  description: 'Offer id.',
});

const BINARY = { type: 'string', format: 'binary' } as const;

/** The image of an offer, a sub-resource (adrs/0031-offer-image.md). */
@ApiTags('offers')
@Controller('offers/:offerId/image')
export class OfferImagesController {
  constructor(private readonly images: OfferImagesService) {}

  @Put()
  @ApiOperation({
    summary: 'Set or replace the image of an offer',
    description:
      'The body is the raw image (JPEG, PNG, WebP or GIF, at most 10 MiB) with its Content-Type, e.g. `curl -X PUT --data-binary @ad.png -H "Content-Type: image/png"`. The format is detected from the bytes.',
  })
  @OFFER_ID
  @ApiConsumes(...OFFER_IMAGE_TYPES)
  @ApiBody({ schema: BINARY })
  @ApiOkResponse({ type: OfferImageDto })
  @ApiInvalidRequest()
  @ApiNotFound('offer')
  @ApiImageRejected(OFFER_IMAGE_MAX_BYTES)
  async put(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Req() request: IncomingMessage,
  ): Promise<OfferImage> {
    const data = await readBody(request, OFFER_IMAGE_MAX_BYTES);
    return this.images.put(offerId, data);
  }

  @Get()
  // Always checked with the API: a replaced image keeps its URL.
  @Header('Cache-Control', 'private, no-cache')
  @ApiOperation({ summary: 'Get the image of an offer (its bytes)' })
  @OFFER_ID
  @ApiProduces(...OFFER_IMAGE_TYPES)
  @ApiOkResponse({ description: 'The image.', schema: BINARY })
  @ApiInvalidRequest()
  @ApiNotFound('offer-image')
  async get(
    @Param('offerId', ParseIdPipe) offerId: string,
  ): Promise<StreamableFile> {
    const { contentType, byteSize, stream } = await this.images.get(offerId);
    return new StreamableFile(stream, {
      type: contentType,
      length: byteSize,
      disposition: 'inline',
    });
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the image of an offer' })
  @OFFER_ID
  @ApiNoContentResponse({ description: 'Removed.' })
  @ApiInvalidRequest()
  @ApiNotFound('offer-image')
  remove(@Param('offerId', ParseIdPipe) offerId: string): Promise<void> {
    return this.images.remove(offerId);
  }
}
