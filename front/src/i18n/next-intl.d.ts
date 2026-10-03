import type messages from '../../messages/fr.json';
import type { Locale } from './config';
import type { formats } from './formats';

// Types translation keys and format names from the French catalogue, the
// reference: a missing or misspelled key fails the type check.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
