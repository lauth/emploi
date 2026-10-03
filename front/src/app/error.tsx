'use client';

import { useTranslations } from 'next-intl';

/** Shown when rendering fails, e.g. when the API is unreachable. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('text')}</p>
      <p>
        <button type="button" onClick={reset}>
          {t('retry')}
        </button>
      </p>
    </>
  );
}
