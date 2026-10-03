import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures/offers.js';

test('the home page redirects to the offers', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL('/offers');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Offers');
});

test('adds an offer from the form', async ({ page, offers }) => {
  const title = offers.uniqueTitle('Frontend developer');

  await page.goto('/offers');
  await page.getByRole('link', { name: 'Add an offer' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Company').fill('Globex');
  await page.getByLabel('Link to the offer').fill('https://example.com/jobs/7');
  await page.getByLabel('Location').fill('Paris');
  await page.getByLabel('Applied on').fill('2026-10-01');
  await page.getByLabel('Description').fill('React and TypeScript.\nHybrid.');
  await page.getByRole('button', { name: 'Add the offer' }).click();

  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
  offers.track(page.url());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.getByText('Globex · Paris')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'https://example.com/jobs/7' }),
  ).toHaveAttribute('target', '_blank');
  await expect(page.getByText('1 Oct 2026')).toBeVisible();
  await expect(page.getByText('React and TypeScript.')).toBeVisible();

  await page.getByRole('link', { name: '← All offers' }).click();
  await expect(page.getByRole('link', { name: title })).toBeVisible();
});

test('shows the server validation errors and keeps the input', async ({
  page,
}) => {
  await page.goto('/offers/new');
  // Both values pass the browser's own checks; the server action rejects them.
  await page.getByLabel('Title').fill('   ');
  await page.getByLabel('Company').fill('Globex');
  await page.getByLabel('Link to the offer').fill('ftp://example.com/jobs/7');
  await page.getByRole('button', { name: 'Add the offer' }).click();

  const titleField = page.getByLabel('Title');
  await expect(titleField).toHaveAttribute('aria-invalid', 'true');
  await expect(titleField).toHaveAccessibleDescription('Required');
  await expect(
    page.getByLabel('Link to the offer'),
  ).toHaveAccessibleDescription('Must be an http:// or https:// URL');
  await expect(page.getByLabel('Company')).toHaveValue('Globex');
  await expect(page).toHaveURL('/offers/new');
});

test('adds an offer with only a title', async ({ page, offers }) => {
  const title = offers.uniqueTitle('Anonymous posting');

  await page.goto('/offers/new');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Add the offer' }).click();

  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
  const id = offers.track(page.url());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);

  await page.goto(`/offers/${id}/edit`);
  await expect(page.getByLabel('Company')).toHaveValue('');
});

test('edits an offer and clears optional fields', async ({ page, offers }) => {
  const offer = await offers.create({
    company: 'Acme',
    url: 'https://jobs.example.com/42',
    location: 'Lyon',
  });

  await page.goto(`/offers/${offer.id}`);
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByLabel('Title')).toHaveValue(offer.title);
  await expect(page.getByLabel('Link to the offer')).toHaveValue(
    'https://jobs.example.com/42',
  );

  await page.getByLabel('Location').fill('Remote');
  await page.getByLabel('Company').clear();
  await page.getByLabel('Link to the offer').clear();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(page.getByText('Remote', { exact: true })).toBeVisible();
  await expect(page.getByText('Acme')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'https://jobs.example.com/42' }),
  ).toHaveCount(0);
  await expect(page.getByText('Updated on')).toBeVisible();
});

test('asks for confirmation before deleting', async ({ page, offers }) => {
  const offer = await offers.create();
  await page.goto(`/offers/${offer.id}`);

  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(offer.title);
  expect(await offers.status(offer.id)).toBe(200);

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page).toHaveURL('/offers');
  await expect(page.getByRole('link', { name: offer.title })).toHaveCount(0);
  expect(await offers.status(offer.id)).toBe(404);
});

test('lists the newest offers first', async ({ page, offers }) => {
  const older = await offers.create({ title: offers.uniqueTitle('Older') });
  const newer = await offers.create({ title: offers.uniqueTitle('Newer') });

  await page.goto('/offers');

  const titles = await page
    .getByRole('listitem')
    .getByRole('link')
    .allTextContents();
  expect(titles.indexOf(newer.title)).toBeGreaterThanOrEqual(0);
  expect(titles.indexOf(newer.title)).toBeLessThan(titles.indexOf(older.title));
});

test('shows a not found page for an unknown offer', async ({ page }) => {
  const response = await page.goto(`/offers/${randomUUID()}`);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not found');
});
