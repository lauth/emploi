import type { Messages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, type Locale } from './config';
import { formats } from './formats';

/** One catalogue per locale; `fr` is the reference the keys are typed from. */
const catalogues: Record<Locale, () => Promise<Messages>> = {
  fr: () => import('../../messages/fr.json').then((module) => module.default),
};

/** Translations and formats of the current request (adrs/0016-internationalized-interface.md). */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: await catalogues[locale](),
    formats,
    // Pages are rendered on the server: show times in its time zone (k8s/front.yaml).
    timeZone: process.env.TZ ?? 'Europe/Paris',
  };
});
