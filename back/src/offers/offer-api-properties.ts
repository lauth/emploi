import type { ApiPropertyOptions } from '@nestjs/swagger';
import { OFFER_LIMITS } from './offer-limits.js';

/** OpenAPI description of each offer field, shared by request and response DTOs. */
export const OFFER_PROPERTIES = {
  title: {
    description: 'Job title. Trimmed.',
    maxLength: OFFER_LIMITS.title,
    example: 'Développeur backend',
  },
  company: {
    type: String,
    nullable: true,
    description:
      'Employer, when the offer names it. Blank is stored as `null`.',
    maxLength: OFFER_LIMITS.company,
    example: 'Acme',
  },
  url: {
    type: String,
    nullable: true,
    format: 'uri',
    description: 'Link to the offer, `http` or `https`.',
    maxLength: OFFER_LIMITS.url,
    example: 'https://jobs.example.com/42',
  },
  location: {
    type: String,
    nullable: true,
    description: 'City, country or "Remote".',
    maxLength: OFFER_LIMITS.location,
    example: 'Lyon',
  },
  description: {
    type: String,
    nullable: true,
    description: 'Text of the offer.',
    maxLength: OFFER_LIMITS.description,
  },
  appliedAt: {
    type: String,
    nullable: true,
    format: 'date',
    description: 'Day the user responded to the offer, `YYYY-MM-DD`.',
    example: '2026-09-28',
  },
} satisfies Record<string, ApiPropertyOptions>;
