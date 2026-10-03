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
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { ListOffersQueryDto } from './dto/list-offers-query.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OffersService } from './offers.service.js';

@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Post()
  create(@Body() body: CreateOfferDto): Promise<Offer> {
    return this.offers.create(body);
  }

  @Get()
  list(@Query() query: ListOffersQueryDto): Promise<Page<Offer>> {
    return this.offers.list(query.limit, query.offset);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offers.get(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOfferDto,
  ): Promise<Offer> {
    return this.offers.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.offers.remove(id);
  }
}
