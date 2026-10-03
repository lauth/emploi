import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/offers.js';

/** The steps of the interview process section, in order. */
function stepItems(page: Page) {
  return page
    .getByRole('region', { name: 'Interview process' })
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
  await expect(page.getByText('No step yet.')).toBeVisible();

  await page.getByRole('link', { name: 'Add a step' }).click();
  await expect(page.getByLabel('Status')).toHaveValue('planned');
  await page.getByLabel('Step').fill('Phone screen with HR');
  await page.getByLabel('Date').fill('2026-10-06');
  await page.getByLabel('Notes').fill('Ask about remote work.');
  await page.getByRole('button', { name: 'Add the step' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  const phoneScreen = step(page, 'Phone screen with HR');
  await expect(phoneScreen).toContainText('Planned');
  await expect(phoneScreen).toContainText('6 Oct 2026');
  await expect(phoneScreen).toContainText('Ask about remote work.');

  await page.getByRole('link', { name: 'Add a step' }).click();
  await page.getByLabel('Step').fill('Technical test');
  await page.getByRole('button', { name: 'Add the step' }).click();

  await expect(stepItems(page).getByRole('heading')).toHaveText([
    'Phone screen with HR',
    'Technical test',
  ]);
  await expect(step(page, 'Technical test')).toContainText('Date not set');
});

test('shows the server validation errors of a step', async ({
  page,
  offers,
}) => {
  const offer = await offers.create();

  await page.goto(`/offers/${offer.id}/steps/new`);
  // Passes the browser's `required` check; the server action rejects it.
  await page.getByLabel('Step').fill('   ');
  await page.getByLabel('Notes').fill('Keep this text.');
  await page.getByRole('button', { name: 'Add the step' }).click();

  await expect(page.getByLabel('Step')).toHaveAccessibleDescription('Required');
  await expect(page.getByLabel('Notes')).toHaveValue('Keep this text.');
  expect(await offers.stepTitles(offer.id)).toEqual([]);
});

test('updates the status of a step', async ({ page, offers }) => {
  const offer = await offers.create();
  await offers.addStep(offer.id, { title: 'Onsite interview' });

  await page.goto(`/offers/${offer.id}`);
  await step(page, 'Onsite interview')
    .getByRole('link', { name: 'Edit' })
    .click();
  await expect(page.getByLabel('Step')).toHaveValue('Onsite interview');
  await page.getByLabel('Status').selectOption({ label: 'Passed' });
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(step(page, 'Onsite interview')).toContainText('Passed');
});

test('reorders the steps', async ({ page, offers }) => {
  const offer = await offers.create();
  for (const title of ['First', 'Second', 'Third']) {
    await offers.addStep(offer.id, { title });
  }

  await page.goto(`/offers/${offer.id}`);
  const headings = stepItems(page).getByRole('heading');
  await expect(headings).toHaveText(['First', 'Second', 'Third']);
  // The first step can't move up, the last can't move down.
  await expect(
    step(page, 'First').getByRole('button', { name: 'Move up' }),
  ).toHaveCount(0);
  await expect(
    step(page, 'Third').getByRole('button', { name: 'Move down' }),
  ).toHaveCount(0);

  await step(page, 'Third').getByRole('button', { name: 'Move up' }).click();
  await expect(headings).toHaveText(['First', 'Third', 'Second']);

  await step(page, 'First').getByRole('button', { name: 'Move down' }).click();
  await expect(headings).toHaveText(['Third', 'First', 'Second']);

  expect(await offers.stepTitles(offer.id)).toEqual([
    'Third',
    'First',
    'Second',
  ]);
});

test('deletes a step after confirmation', async ({ page, offers }) => {
  const offer = await offers.create();
  await offers.addStep(offer.id, { title: 'Keep me' });
  await offers.addStep(offer.id, { title: 'Delete me' });

  await page.goto(`/offers/${offer.id}`);

  page.once('dialog', (dialog) => void dialog.dismiss());
  await step(page, 'Delete me').getByRole('button', { name: 'Delete' }).click();
  await expect(stepItems(page)).toHaveCount(2);

  page.once('dialog', (dialog) => void dialog.accept());
  await step(page, 'Delete me').getByRole('button', { name: 'Delete' }).click();

  await expect(stepItems(page).getByRole('heading')).toHaveText(['Keep me']);
  expect(await offers.stepTitles(offer.id)).toEqual(['Keep me']);
});

test('shows a not found page for an unknown step', async ({ page, offers }) => {
  const offer = await offers.create();

  const response = await page.goto(
    `/offers/${offer.id}/steps/00000000-0000-4000-8000-000000000000/edit`,
  );

  expect(response?.status()).toBe(404);
});
