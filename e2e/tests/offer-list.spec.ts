import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/offers.js';

// Filters, sort and pagination of the offer list
// (adrs/0020-offer-list-filters-sorting-and-pagination.md). Each test gives its
// offers a unique token and searches for it, so the user's own offers never
// show up in the results.

/** Titles of the listed offers, in order. */
function listedTitles(page: Page) {
  return page.getByRole('list').getByRole('listitem').getByRole('link');
}

test('sorts by most recent application by default, offers without a date last', async ({
  page,
  offers,
}) => {
  const token = randomUUID().slice(0, 8);
  await offers.create({ title: `Ancienne ${token}`, appliedAt: '2026-09-01' });
  await offers.create({ title: `Sans date ${token}` });
  await offers.create({ title: `Récente ${token}`, appliedAt: '2026-09-20' });

  await page.goto('/offers');
  await page.getByRole('searchbox', { name: 'Rechercher' }).fill(token);
  await page.getByRole('button', { name: 'Appliquer' }).click();

  await expect(page).toHaveURL(new RegExp(`q=${token}`));
  await expect(page.getByLabel('Trier par')).toHaveValue('appliedAt-desc');
  await expect(listedTitles(page)).toHaveText([
    `Récente ${token}`,
    `Ancienne ${token}`,
    `Sans date ${token}`,
  ]);
  await expect(page.getByRole('status')).toHaveText(
    '3 offres correspondent aux filtres',
  );
});

test('sorts titles alphabetically, accents and case included', async ({
  page,
  offers,
}) => {
  const token = randomUUID().slice(0, 8);
  for (const word of ['Zèbre', 'éco', 'Alpha', 'beta']) {
    await offers.create({ title: `${word} ${token}` });
  }

  await page.goto(`/offers?q=${token}`);
  await page
    .getByLabel('Trier par')
    .selectOption({ label: 'Intitulé, de A à Z' });
  await page.getByRole('button', { name: 'Appliquer' }).click();

  await expect(listedTitles(page)).toHaveText([
    `Alpha ${token}`,
    `beta ${token}`,
    `éco ${token}`,
    `Zèbre ${token}`,
  ]);
  // The search is kept when changing the sort.
  await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toHaveValue(
    token,
  );
});

test('filters by application period', async ({ page, offers }) => {
  const token = randomUUID().slice(0, 8);
  await offers.create({ title: `Août ${token}`, appliedAt: '2026-08-20' });
  await offers.create({ title: `Septembre ${token}`, appliedAt: '2026-09-15' });
  await offers.create({ title: `Sans date ${token}` });

  await page.goto(`/offers?q=${token}`);
  await page.getByLabel('Candidature à partir du').fill('2026-09-01');
  await page.getByLabel('Candidature jusqu’au').fill('2026-09-30');
  await page.getByRole('button', { name: 'Appliquer' }).click();

  await expect(listedTitles(page)).toHaveText([`Septembre ${token}`]);
  await expect(page.getByRole('status')).toHaveText(
    '1 offre correspond aux filtres',
  );
});

test('paginates and keeps the filters from page to page', async ({
  page,
  offers,
}) => {
  const token = randomUUID().slice(0, 8);
  for (let day = 1; day <= 11; day++) {
    const date = `2026-09-${String(day).padStart(2, '0')}`;
    await offers.create({
      title: `Offre ${String(day)} ${token}`,
      appliedAt: date,
    });
  }

  await page.goto(`/offers?q=${token}`);
  await page.getByLabel('Offres par page').selectOption('10');
  await page.getByRole('button', { name: 'Appliquer' }).click();

  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expect(listedTitles(page)).toHaveCount(10);
  await expect(listedTitles(page).first()).toHaveText(`Offre 11 ${token}`);
  await expect(pagination).toContainText('Page 1 sur 2');

  await pagination.getByRole('link', { name: 'Page suivante' }).click();

  await expect(page).toHaveURL(new RegExp(`q=${token}.*page=2.*size=10`));
  await expect(listedTitles(page)).toHaveText([`Offre 1 ${token}`]);
  await expect(pagination).toContainText('Page 2 sur 2');

  await pagination.getByRole('link', { name: 'Page précédente' }).click();
  await expect(listedTitles(page)).toHaveCount(10);
});

test('says when nothing matches, and resets the filters', async ({ page }) => {
  await page.goto(`/offers?q=${randomUUID()}`);

  await expect(
    page.getByText('Aucune offre ne correspond à ces filtres.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Réinitialiser' }).click();

  await expect(page).toHaveURL('/offers');
  await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toHaveValue(
    '',
  );
});

test('ignores invalid parameters in the URL', async ({ page }) => {
  const response = await page.goto('/offers?sort=salary&page=abc&size=7');

  expect(response?.status()).toBe(200);
  await expect(page.getByLabel('Trier par')).toHaveValue('appliedAt-desc');
  await expect(page.getByLabel('Offres par page')).toHaveValue('20');
});
