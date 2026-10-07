import { testTranslator } from '@/test/intl';
import type { TranslateValidation } from './forms';
import {
  EMPTY_OFFER_FORM,
  parseOfferForm,
  readOfferForm,
  type OfferFormValues,
} from './offer-form';

/** Returns the message key (and limit), to assert which rule failed. */
const keys: TranslateValidation = (message, { max }) =>
  message === 'tooLong' ? `tooLong:${String(max)}` : message;

const valid: OfferFormValues = {
  ...EMPTY_OFFER_FORM,
  title: 'Backend developer',
  company: 'Acme',
};

describe('parseOfferForm', () => {
  it('trims values and turns empty optional fields into null', () => {
    const result = parseOfferForm(
      {
        ...valid,
        title: '  Backend developer ',
        location: '   ',
        appliedAt: '2026-09-28',
      },
      keys,
    );

    expect(result).toEqual({
      success: true,
      data: {
        title: 'Backend developer',
        company: 'Acme',
        url: null,
        location: null,
        description: null,
        appliedAt: '2026-09-28',
        status: 'applied',
      },
    });
  });

  it('accepts an offer without a company', () => {
    const result = parseOfferForm({ ...valid, company: '   ' }, keys);

    expect(result).toMatchObject({ success: true, data: { company: null } });
  });

  it.each<[string, Partial<OfferFormValues>, string, string]>([
    ['a missing title', { title: '' }, 'title', 'required'],
    [
      'a company too long',
      { company: 'x'.repeat(201) },
      'company',
      'tooLong:200',
    ],
    ['a title too long', { title: 'x'.repeat(201) }, 'title', 'tooLong:200'],
    ['a non-http URL', { url: 'ftp://example.com' }, 'url', 'invalidUrl'],
    ['a malformed URL', { url: 'not a url' }, 'url', 'invalidUrl'],
    [
      'an impossible date',
      { appliedAt: '2026-02-30' },
      'appliedAt',
      'invalidDate',
    ],
    [
      'a date with a time',
      { appliedAt: '2026-09-28T10:00' },
      'appliedAt',
      'invalidDate',
    ],
    ['an unknown status', { status: 'hired' }, 'status', 'invalidChoice'],
    ['a missing status', { status: '' }, 'status', 'invalidChoice'],
  ])('rejects %s', (_case, override, field, message) => {
    const result = parseOfferForm({ ...valid, ...override }, keys);

    expect(result).toEqual({
      success: false,
      fieldErrors: { [field]: [message] },
    });
  });

  it('accepts http and https URLs', () => {
    for (const url of ['http://example.com', 'https://example.com/jobs/1']) {
      expect(parseOfferForm({ ...valid, url }, keys).success).toBe(true);
    }
  });

  it('translates the messages', () => {
    const french: TranslateValidation = (message, values) =>
      testTranslator(`validation.${message}`, values);

    const result = parseOfferForm(
      { ...valid, title: '', description: 'x'.repeat(20001) },
      french,
    );

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        title: ['Champ obligatoire'],
        // Narrow no-break space as the French thousands separator.
        description: ['20 000 caractères maximum'],
      },
    });
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
      status: '',
    });
  });
});
