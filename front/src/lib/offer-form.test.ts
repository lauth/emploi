import {
  EMPTY_OFFER_FORM,
  parseOfferForm,
  readOfferForm,
  type OfferFormValues,
} from './offer-form';

const valid: OfferFormValues = {
  ...EMPTY_OFFER_FORM,
  title: 'Backend developer',
  company: 'Acme',
};

describe('parseOfferForm', () => {
  it('trims values and turns empty optional fields into null', () => {
    const result = parseOfferForm({
      ...valid,
      title: '  Backend developer ',
      location: '   ',
      appliedAt: '2026-09-28',
    });

    expect(result).toEqual({
      success: true,
      data: {
        title: 'Backend developer',
        company: 'Acme',
        url: null,
        location: null,
        description: null,
        appliedAt: '2026-09-28',
      },
    });
  });

  it.each<[string, Partial<OfferFormValues>, string]>([
    ['a missing title', { title: '' }, 'title'],
    ['a blank company', { company: '   ' }, 'company'],
    ['a title too long', { title: 'x'.repeat(201) }, 'title'],
    ['a non-http URL', { url: 'ftp://example.com' }, 'url'],
    ['a malformed URL', { url: 'not a url' }, 'url'],
    ['an impossible date', { appliedAt: '2026-02-30' }, 'appliedAt'],
    ['a date with a time', { appliedAt: '2026-09-28T10:00' }, 'appliedAt'],
  ])('rejects %s', (_case, override, field) => {
    const result = parseOfferForm({ ...valid, ...override });

    expect(result.success).toBe(false);
    expect(result.success ? undefined : result.fieldErrors).toHaveProperty(
      field,
    );
  });

  it('accepts http and https URLs', () => {
    for (const url of ['http://example.com', 'https://example.com/jobs/1']) {
      expect(parseOfferForm({ ...valid, url }).success).toBe(true);
    }
  });
});

describe('readOfferForm', () => {
  it('reads the offer fields and defaults missing ones to empty strings', () => {
    const formData = new FormData();
    formData.set('title', 'Dev');
    formData.set('company', 'Acme');
    formData.set('$ACTION_ID_123', 'ignored');

    expect(readOfferForm(formData)).toEqual({
      ...EMPTY_OFFER_FORM,
      title: 'Dev',
      company: 'Acme',
    });
  });
});
