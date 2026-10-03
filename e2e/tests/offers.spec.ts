import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures/offers.js';

test('the home page redirects to the offers, in French', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL('/offers');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle('Offres · emploi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Offres');
  await expect(
    page.getByRole('navigation', { name: 'Navigation principale' }),
  ).toBeVisible();
});

test('adds an offer from the form', async ({ page, offers }) => {
  const title = offers.uniqueTitle('Développeur frontend');

  await page.goto('/offers');
  await page.getByRole('link', { name: 'Ajouter une offre' }).click();
  await expect(page).toHaveTitle('Ajouter une offre · emploi');
  await page.getByLabel('Intitulé du poste').fill(title);
  await page.getByLabel('Entreprise').fill('Globex');
  await page.getByLabel('Lien vers l’offre').fill('https://example.com/jobs/7');
  await page.getByLabel('Lieu').fill('Paris');
  await page.getByLabel('Date de candidature').fill('2026-10-01');
  await page.getByLabel('Description').fill('React et TypeScript.\nHybride.');
  await page.getByRole('button', { name: 'Ajouter l’offre' }).click();

  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
  offers.track(page.url());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.getByText('Globex · Paris')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'https://example.com/jobs/7' }),
  ).toHaveAttribute('target', '_blank');
  await expect(page.getByText('1 oct. 2026')).toBeVisible();
  await expect(page.getByText('React et TypeScript.')).toBeVisible();

  await page.getByRole('link', { name: '← Toutes les offres' }).click();
  const card = page.getByRole('listitem').filter({ hasText: title });
  await expect(card).toContainText('Candidature le 1 oct. 2026');
});

test('shows the server validation errors in French and keeps the input', async ({
  page,
}) => {
  await page.goto('/offers/new');
  // Both values pass the browser's own checks; the server action rejects them.
  await page.getByLabel('Intitulé du poste').fill('   ');
  await page.getByLabel('Entreprise').fill('Globex');
  await page.getByLabel('Lien vers l’offre').fill('ftp://example.com/jobs/7');
  await page.getByRole('button', { name: 'Ajouter l’offre' }).click();

  const titleField = page.getByLabel('Intitulé du poste');
  await expect(titleField).toHaveAttribute('aria-invalid', 'true');
  await expect(titleField).toHaveAccessibleDescription('Champ obligatoire');
  await expect(
    page.getByLabel('Lien vers l’offre'),
  ).toHaveAccessibleDescription(
    'Saisissez une adresse commençant par http:// ou https://',
  );
  await expect(page.getByLabel('Entreprise')).toHaveValue('Globex');
  await expect(page).toHaveURL('/offers/new');
});

test('adds an offer with only a title', async ({ page, offers }) => {
  const title = offers.uniqueTitle('Annonce anonyme');

  await page.goto('/offers/new');
  await page.getByLabel('Intitulé du poste').fill(title);
  await page.getByRole('button', { name: 'Ajouter l’offre' }).click();

  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
  const id = offers.track(page.url());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);

  await page.goto(`/offers/${id}/edit`);
  await expect(page.getByLabel('Entreprise')).toHaveValue('');
});

test('edits an offer and clears optional fields', async ({ page, offers }) => {
  const offer = await offers.create({
    company: 'Acme',
    url: 'https://jobs.example.com/42',
    location: 'Lyon',
  });

  await page.goto(`/offers/${offer.id}`);
  await page.getByRole('link', { name: 'Modifier', exact: true }).click();
  await expect(page.getByLabel('Intitulé du poste')).toHaveValue(offer.title);
  await expect(page.getByLabel('Lien vers l’offre')).toHaveValue(
    'https://jobs.example.com/42',
  );

  await page.getByLabel('Lieu').fill('Télétravail');
  await page.getByLabel('Entreprise').clear();
  await page.getByLabel('Lien vers l’offre').clear();
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(page.getByText('Télétravail', { exact: true })).toBeVisible();
  await expect(page.getByText('Acme')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'https://jobs.example.com/42' }),
  ).toHaveCount(0);
  await expect(page.getByText('Modifiée le')).toBeVisible();
});

test('asks for confirmation before deleting', async ({ page, offers }) => {
  const offer = await offers.create();
  await page.goto(`/offers/${offer.id}`);

  page.once('dialog', (dialog) => {
    expect(dialog.message()).toBe(
      'Supprimer cette offre et ses étapes d’entretien ? Cette action est définitive.',
    );
    void dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(offer.title);
  expect(await offers.status(offer.id)).toBe(200);

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Supprimer' }).click();

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Page introuvable',
  );
});
