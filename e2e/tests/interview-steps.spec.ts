import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/offers.js';

/** The steps of the interview process section, in order. */
function stepItems(page: Page) {
  return page
    .getByRole('region', { name: 'Processus de recrutement' })
    .getByRole('listitem');
}

function step(page: Page, title: string) {
  return stepItems(page).filter({
    has: page.getByRole('heading', { name: title }),
  });
}

test('adds interview steps to an offer', async ({ page, offers }) => {
  const offer = await offers.create();

  await page.goto(`/offers/${offer.id}`);
  await expect(page.getByText('Aucune étape pour l’instant.')).toBeVisible();

  await page.getByRole('link', { name: 'Ajouter une étape' }).click();
  await expect(page.getByLabel('Statut')).toHaveValue('planned');
  await page.getByLabel('Étape').fill('Entretien téléphonique RH');
  await page.getByLabel('Date', { exact: true }).fill('2026-10-06');
  await page.getByLabel('Notes').fill('Demander pour le télétravail.');
  await page.getByRole('button', { name: 'Ajouter l’étape' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  const phoneScreen = step(page, 'Entretien téléphonique RH');
  await expect(phoneScreen).toContainText('Prévue');
  await expect(phoneScreen).toContainText('6 oct. 2026');
  await expect(phoneScreen).toContainText('Demander pour le télétravail.');

  await page.getByRole('link', { name: 'Ajouter une étape' }).click();
  await page.getByLabel('Étape').fill('Test technique');
  await page.getByRole('button', { name: 'Ajouter l’étape' }).click();

  await expect(stepItems(page).getByRole('heading')).toHaveText([
    'Entretien téléphonique RH',
    'Test technique',
  ]);
  await expect(step(page, 'Test technique')).toContainText('Date à définir');
});

test('shows the server validation errors of a step in French', async ({
  page,
  offers,
}) => {
  const offer = await offers.create();

  await page.goto(`/offers/${offer.id}/steps/new`);
  // Passes the browser's `required` check; the server action rejects it.
  await page.getByLabel('Étape').fill('   ');
  await page.getByLabel('Notes').fill('Garder ce texte.');
  await page.getByRole('button', { name: 'Ajouter l’étape' }).click();

  await expect(page.getByLabel('Étape')).toHaveAccessibleDescription(
    'Champ obligatoire',
  );
  await expect(page.getByLabel('Notes')).toHaveValue('Garder ce texte.');
  expect(await offers.stepTitles(offer.id)).toEqual([]);
});

test('updates the status of a step', async ({ page, offers }) => {
  const offer = await offers.create();
  await offers.addStep(offer.id, { title: 'Entretien sur site' });

  await page.goto(`/offers/${offer.id}`);
  await step(page, 'Entretien sur site')
    .getByRole('link', { name: 'Modifier' })
    .click();
  await expect(page.getByLabel('Étape')).toHaveValue('Entretien sur site');
  await page.getByLabel('Statut').selectOption({ label: 'Validée' });
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(step(page, 'Entretien sur site')).toContainText('Validée');
});

test('reorders the steps', async ({ page, offers }) => {
  const offer = await offers.create();
  for (const title of ['Première', 'Deuxième', 'Troisième']) {
    await offers.addStep(offer.id, { title });
  }

  await page.goto(`/offers/${offer.id}`);
  const headings = stepItems(page).getByRole('heading');
  await expect(headings).toHaveText(['Première', 'Deuxième', 'Troisième']);
  // The first step can't move up, the last can't move down.
  await expect(
    step(page, 'Première').getByRole('button', { name: 'Monter' }),
  ).toHaveCount(0);
  await expect(
    step(page, 'Troisième').getByRole('button', { name: 'Descendre' }),
  ).toHaveCount(0);

  await step(page, 'Troisième').getByRole('button', { name: 'Monter' }).click();
  await expect(headings).toHaveText(['Première', 'Troisième', 'Deuxième']);

  await step(page, 'Première')
    .getByRole('button', { name: 'Descendre' })
    .click();
  await expect(headings).toHaveText(['Troisième', 'Première', 'Deuxième']);

  expect(await offers.stepTitles(offer.id)).toEqual([
    'Troisième',
    'Première',
    'Deuxième',
  ]);
});

test('deletes a step after confirmation', async ({ page, offers }) => {
  const offer = await offers.create();
  await offers.addStep(offer.id, { title: 'À garder' });
  await offers.addStep(offer.id, { title: 'À supprimer' });

  await page.goto(`/offers/${offer.id}`);

  page.once('dialog', (dialog) => {
    expect(dialog.message()).toBe('Supprimer l’étape « À supprimer » ?');
    void dialog.dismiss();
  });
  await step(page, 'À supprimer')
    .getByRole('button', { name: 'Supprimer' })
    .click();
  await expect(stepItems(page)).toHaveCount(2);

  page.once('dialog', (dialog) => void dialog.accept());
  await step(page, 'À supprimer')
    .getByRole('button', { name: 'Supprimer' })
    .click();

  await expect(stepItems(page).getByRole('heading')).toHaveText(['À garder']);
  expect(await offers.stepTitles(offer.id)).toEqual(['À garder']);
});

test('shows a not found page for an unknown step', async ({ page, offers }) => {
  const offer = await offers.create();

  const response = await page.goto(
    `/offers/${offer.id}/steps/00000000-0000-4000-8000-000000000000/edit`,
  );

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Page introuvable',
  );
});
