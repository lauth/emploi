import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/offers.js';

// Security headers of the pages (adrs/0029-security-headers.md): the
// Content-Security-Policy must not block anything the app itself does.

test.beforeEach(async ({ page }) => {
  // Collects the violations reported by the browser, page by page.
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(
        `${event.violatedDirective} ${event.blockedURI} (${event.sourceFile}:${String(event.lineNumber)})`,
      );
    });
  });
});

function violations(page: Page) {
  return page.evaluate(
    () => (window as unknown as { cspViolations: string[] }).cspViolations,
  );
}

test('serves pages with a nonce-based Content-Security-Policy', async ({
  page,
}) => {
  const response = await page.goto('/offers');
  const headers = response?.headers() ?? {};

  expect(headers['content-security-policy']).toMatch(
    /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
  );
  expect(headers).toMatchObject({
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
  expect(headers).not.toHaveProperty('x-powered-by');

  // A new nonce for every request.
  const again = await page.goto('/offers');
  expect(again?.headers()['content-security-policy']).not.toBe(
    headers['content-security-policy'],
  );
});

test('the policy blocks nothing on the list, the popover, an offer and its form', async ({
  page,
  offers,
}) => {
  const offer = await offers.create();

  await page.goto('/offers');
  // The popover is positioned with a style attribute.
  await page
    .getByRole('button', { name: 'Filtrer par date de candidature' })
    .click();
  await expect(page.getByLabel('À partir du')).toBeVisible();
  expect(await violations(page)).toEqual([]);

  await page.goto(`/offers/${offer.id}/edit`);
  const title = offers.uniqueTitle('Modifiée');
  await page.getByLabel('Intitulé du poste').fill(title);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  expect(await violations(page)).toEqual([]);
});
