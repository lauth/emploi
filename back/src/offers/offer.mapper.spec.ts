import type { Offer as OfferModel } from '../generated/prisma/client.js';
import { toOffer } from './offer.mapper.js';

describe('toOffer', () => {
  const model: OfferModel = {
    id: '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d',
    title: 'Backend developer',
    company: 'Acme',
    url: 'https://jobs.example.com/42',
    location: 'Lyon',
    description: 'Node.js and PostgreSQL',
    appliedAt: new Date('2026-09-28T00:00:00.000Z'),
    createdAt: new Date('2026-10-01T08:30:00.000Z'),
    updatedAt: new Date('2026-10-02T09:45:00.000Z'),
  };

  it('formats dates for the API', () => {
    expect(toOffer(model)).toEqual({
      id: model.id,
      title: 'Backend developer',
      company: 'Acme',
      url: 'https://jobs.example.com/42',
      location: 'Lyon',
      description: 'Node.js and PostgreSQL',
      appliedAt: '2026-09-28',
      createdAt: '2026-10-01T08:30:00.000Z',
      updatedAt: '2026-10-02T09:45:00.000Z',
    });
  });

  it('keeps missing optional fields as null', () => {
    const offer = toOffer({
      ...model,
      url: null,
      location: null,
      description: null,
      appliedAt: null,
    });

    expect(offer).toMatchObject({
      url: null,
      location: null,
      description: null,
      appliedAt: null,
    });
  });
});
