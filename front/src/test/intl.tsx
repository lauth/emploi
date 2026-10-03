import { render, type RenderOptions } from '@testing-library/react';
import {
  createFormatter,
  createTranslator,
  NextIntlClientProvider,
} from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import messages from '../../messages/fr.json';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { formats } from '@/i18n/formats';

// The real French catalogue and formats in tests (adrs/0016-internationalized-interface.md).

const TIME_ZONE = 'Europe/Paris';

export function IntlProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={DEFAULT_LOCALE}
      messages={messages}
      formats={formats}
      timeZone={TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** Renders a component that uses `useTranslations` or `useFormatter`. */
export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: IntlProvider, ...options });
}

/** What `getFormatter()` returns on the server. */
export const testFormatter = createFormatter({
  locale: DEFAULT_LOCALE,
  formats,
  timeZone: TIME_ZONE,
});

/** What `getTranslations()` returns on the server (whole catalogue). */
export const testTranslator = createTranslator({
  locale: DEFAULT_LOCALE,
  messages,
  formats,
  timeZone: TIME_ZONE,
});
