import { randomUUID } from 'node:crypto';
import type { CreateOfferRequest, Offer } from '@emploi/shared';
import { test as base, expect } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'https://api.emploi.localhost';

/**
 * Test data for offers. The cluster database holds real data, so every offer
 * gets a unique title and everything created is deleted after the test
 * (adrs/0013-browser-tests-with-playwright.md).
 */
export interface OffersFixture {
  /** A title no other offer has, e.g. "Backend developer [e2e 1a2b3c4d]". */
  uniqueTitle: (label: string) => string;
  /** Creates an offer through the API; it is deleted after the test. */
  create: (input?: Partial<CreateOfferRequest>) => Promise<Offer>;
  /** HTTP status of `GET /offers/:id`. */
  status: (id: string) => Promise<number>;
  /** Registers an offer created through the UI so it is deleted after the test. */
  track: (offerUrl: string) => string;
}

const OFFER_PATH = /\/offers\/([0-9a-f-]{36})$/;

export const test = base.extend<{ offers: OffersFixture }>({
  offers: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: API_URL,
      ignoreHTTPSErrors: true,
    });
    const created = new Set<string>();

    const uniqueTitle = (label: string) =>
      `${label} [e2e ${randomUUID().slice(0, 8)}]`;

    await use({
      uniqueTitle,

      async create(input = {}) {
        const response = await api.post('/offers', {
          data: {
            title: uniqueTitle('Offer'),
            company: 'Acme',
            ...input,
          },
        });
        expect(response.status(), await response.text()).toBe(201);
        const offer = (await response.json()) as Offer;
        created.add(offer.id);
        return offer;
      },

      async status(id) {
        return (await api.get(`/offers/${id}`)).status();
      },

      track(offerUrl) {
        const id = OFFER_PATH.exec(new URL(offerUrl).pathname)?.[1];
        if (id === undefined) {
          throw new Error(`Not an offer URL: ${offerUrl}`);
        }
        created.add(id);
        return id;
      },
    });

    for (const id of created) {
      const response = await api.delete(`/offers/${id}`);
      // 404: the test deleted it already.
      if (!response.ok() && response.status() !== 404) {
        throw new Error(
          `Could not delete offer ${id}: ${String(response.status())}`,
        );
      }
    }
    await api.dispose();
  },
});

export { expect };
