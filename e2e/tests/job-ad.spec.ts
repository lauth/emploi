import { expect, test } from '../fixtures/offers.js';

// The "Récupérer l'annonce" button of the offer form
// (adrs/0032-fetch-job-ad.md). The API fetches the link; these tests don't
// depend on a job board being up, so they cover the paths that stay local.
// Messages are located by text: Next's route announcer is an `alert` too.

test('asks for the link before fetching the ad', async ({ page }) => {
  await page.goto('/offers/new');

  await page.getByRole('button', { name: 'Récupérer l’annonce' }).click();

  await expect(
    page.getByText('Saisissez d’abord le lien de l’annonce.'),
  ).toBeVisible();
});

test('never fetches a local address, and says the page could not be fetched', async ({
  page,
}) => {
  await page.goto('/offers/new');
  // The node itself, from the back pod: refused by the SSRF guard.
  await page.getByLabel('Lien vers l’offre').fill('http://127.0.0.1/');

  await page.getByRole('button', { name: 'Récupérer l’annonce' }).click();

  await expect(
    page.getByText(
      'La page n’a pas pu être récupérée (site protégé, connexion requise ou lien invalide). Copiez le texte de l’annonce à la main.',
    ),
  ).toBeVisible();
  await expect(page.getByLabel('Description')).toHaveValue('');
});

test('says when the link is not one the API accepts', async ({ page }) => {
  await page.goto('/offers/new');
  // No domain extension: the API refuses it as a URL.
  await page.getByLabel('Lien vers l’offre').fill('http://back/offers');

  await page.getByRole('button', { name: 'Récupérer l’annonce' }).click();

  await expect(
    page.getByText(
      'Ce lien n’est pas une adresse web valide (http:// ou https://).',
    ),
  ).toBeVisible();
});
