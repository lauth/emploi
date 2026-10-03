import type { Metadata } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app');
  return {
    title: { template: `%s · ${t('name')}`, default: t('name') },
    description: t('description'),
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  const t = await getTranslations();

  return (
    <html lang={locale}>
      <body>
        {/* Gives client components the locale, messages and formats of the request. */}
        <NextIntlClientProvider>
          <header className="site-header">
            <Link href="/offers" className="site-name">
              {t('app.name')}
            </Link>
            <nav aria-label={t('nav.label')}>
              <Link href="/offers">{t('nav.offers')}</Link>
            </nav>
          </header>
          <main className="site-main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
