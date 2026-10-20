import { offerImageUrl, readOfferImage } from './offer-image';

function formWith(image: File | string | null): FormData {
  const formData = new FormData();
  if (image !== null) {
    formData.set('image', image);
  }
  return formData;
}

describe('readOfferImage', () => {
  it.each([
    ['no file input', formWith(null)],
    ['an empty file input', formWith(new File([], ''))],
    ['a text value instead of a file', formWith('image.png')],
  ])('gives no image for %s', (_case, formData) => {
    expect(readOfferImage(formData)).toEqual({ success: true, image: null });
  });

  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
    'accepts %s',
    (type) => {
      const image = new File([new Uint8Array(4)], 'image', { type });

      expect(readOfferImage(formWith(image))).toEqual({
        success: true,
        image,
      });
    },
  );

  it('refuses other formats, SVG included', () => {
    const svg = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });

    expect(readOfferImage(formWith(svg))).toEqual({
      success: false,
      error: 'imageType',
    });
  });

  it('refuses images over 10 MiB', () => {
    const big = new File([new Uint8Array(10_485_761)], 'big.png', {
      type: 'image/png',
    });

    expect(readOfferImage(formWith(big))).toEqual({
      success: false,
      error: 'imageTooLarge',
    });
  });
});

describe('offerImageUrl', () => {
  it('versions the URL with the image’s last change', () => {
    expect(
      offerImageUrl({
        id: 'abc',
        image: {
          contentType: 'image/png',
          byteSize: 10,
          updatedAt: '2026-10-20T10:00:00.000Z',
        },
      }),
    ).toBe('/offers/abc/image?v=2026-10-20T10%3A00%3A00.000Z');
  });

  it('is null without an image', () => {
    expect(offerImageUrl({ id: 'abc', image: null })).toBeNull();
  });
});
