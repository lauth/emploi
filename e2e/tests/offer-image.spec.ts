import { crc32, deflateSync } from 'node:zlib';
import { expect, test } from '../fixtures/offers.js';

// The image of an offer (adrs/0031-offer-image.md): chosen in the form, shown
// as a thumbnail on the offer page, enlarged in a modal dialog, removed.

/** A real PNG of the given size, filled with one colour. */
function png(width: number, height: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed));
    return Buffer.concat([length, typed, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = 2; // RGB
  // Each row: filter byte 0, then RGB pixels.
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.alloc(width * 3, Buffer.from([0x1a, 0x56, 0xdb])),
  ]);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const IMAGE = {
  name: 'annonce.png',
  mimeType: 'image/png',
  buffer: png(320, 200),
};

test('adds an image with a new offer, enlarges it and removes it', async ({
  page,
  offers,
}) => {
  const title = offers.uniqueTitle('Avec image');

  await page.goto('/offers/new');
  await page.getByLabel('Intitulé du poste').fill(title);
  await page.getByLabel('Image').setInputFiles(IMAGE);
  await page.getByRole('button', { name: 'Ajouter l’offre' }).click();

  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}$/);
  offers.track(page.url());

  // The thumbnail shows the image, loaded from the front's own origin.
  const thumbnail = page.getByRole('button', { name: 'Agrandir l’image' });
  await expect(thumbnail).toBeVisible();
  await expect
    .poll(() =>
      thumbnail
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(320);

  await thumbnail.click();
  const dialog = page.getByRole('dialog', {
    name: `Image de l’offre « ${title} »`,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await thumbnail.click();
  await dialog.getByRole('button', { name: 'Fermer' }).click();
  await expect(dialog).toBeHidden();

  page.once('dialog', (confirm) => void confirm.accept());
  await page.getByRole('button', { name: 'Retirer l’image' }).click();
  await expect(thumbnail).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test('replaces the image from the edit form', async ({ page, offers }) => {
  const offer = await offers.create();

  await page.goto(`/offers/${offer.id}/edit`);
  await expect(
    page.getByText('Une capture de l’annonce, par exemple.'),
  ).toBeVisible();
  await page.getByLabel('Image').setInputFiles(IMAGE);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(
    page.getByRole('button', { name: 'Agrandir l’image' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Modifier', exact: true }).click();
  await expect(
    page.getByText('Choisir un fichier remplace l’image actuelle.'),
  ).toBeVisible();
});

test('refuses a file that is not an accepted image', async ({
  page,
  offers,
}) => {
  const offer = await offers.create();

  await page.goto(`/offers/${offer.id}/edit`);
  await page.getByLabel('Image').setInputFiles({
    name: 'logo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  });
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(
    page.getByText('Choisissez une image JPEG, PNG, WebP ou GIF'),
  ).toBeVisible();
  await expect(page).toHaveURL(`/offers/${offer.id}/edit`);
});
