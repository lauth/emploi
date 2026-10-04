import type { Offer, Page } from '@emploi/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiInvalidRequest, ApiNotFound } from '../common/api-docs.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { ListOffersQueryDto } from './dto/list-offers-query.dto.js';
import { OfferDto, OfferPageDto } from './dto/offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OffersService } from './offers.service.js';

const OFFER_NOT_FOUND = 'No offer with this id.';
const OFFER_NOT_FOUND_MESSAGE =
  'Offer 0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d not found';

const OFFER_ID = ApiParam({
  name: 'id',
  format: 'uuid',
  description: 'Offer id.',
});

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an offer' })
  @ApiCreatedResponse({ type: OfferDto })
  @ApiInvalidRequest()
  create(@Body() body: CreateOfferDto): Promise<Offer> {
    return this.offers.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List offers, newest first' })
  @ApiOkResponse({ type: OfferPageDto })
  @ApiInvalidRequest()
  list(@Query() query: ListOffersQueryDto): Promise<Page<Offer>> {
    return this.offers.list(query.limit, query.offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an offer' })
  @OFFER_ID
  @ApiOkResponse({ type: OfferDto })
  @ApiInvalidRequest()
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offers.get(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an offer',
    description:
      'Partial update: absent fields are left unchanged, `null` clears an optional field.',
  })
  @OFFER_ID
  @ApiOkResponse({ type: OfferDto })
  @ApiInvalidRequest()
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOfferDto,
  ): Promise<Offer> {
    return this.offers.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an offer and its interview steps' })
  @OFFER_ID
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiInvalidRequest()
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.offers.remove(id);
  }
}
