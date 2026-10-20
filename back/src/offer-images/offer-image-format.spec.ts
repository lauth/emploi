import { detectImageType, toOfferImageType } from './offer-image-format.js';

/** The first bytes of a file, then some content. */
function file(...start: number[]): Uint8Array {
  return Uint8Array.from([...start, 0x00, 0x01, 0x02]);
}

const ascii = (text: string) => [...new TextEncoder().encode(text)];

describe('detectImageType', () => {
  it.each([
    ['image/jpeg', file(0xff, 0xd8, 0xff, 0xe0)],
    ['image/png', file(0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a)],
    ['image/webp', file(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBP'))],
    ['image/gif', file(...ascii('GIF87a'))],
    ['image/gif', file(...ascii('GIF89a'))],
  ])('recognises %s from its first bytes', (type, bytes) => {
    expect(detectImageType(bytes)).toBe(type);
  });

  it.each([
    [
      'an SVG image',
      file(...ascii('<svg xmlns="http://www.w3.org/2000/svg">')),
    ],
    ['a PDF', file(...ascii('%PDF-1.7'))],
    [
      'a RIFF file that is not WebP',
      file(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WAVE')),
    ],
    ['a truncated PNG signature', Uint8Array.from([0x89, 0x50, 0x4e])],
    ['an empty body', new Uint8Array()],
  ])('refuses %s', (_name, bytes) => {
    expect(detectImageType(bytes)).toBeNull();
  });
});

describe('toOfferImageType', () => {
  it('accepts a known type and fails on anything else', () => {
    expect(toOfferImageType('image/png')).toBe('image/png');
    expect(() => toOfferImageType('image/svg+xml')).toThrow(
      'Unknown offer image type',
    );
  });
});
