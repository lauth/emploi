'use client';

import { unstable_isUnrecognizedActionError } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/** Shown when rendering fails, e.g. when the API is unreachable. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  // A page opened before a deploy called a Server Action the new version no
  // longer has (removed or renamed; unchanged ones keep their id,
  // adrs/0023-stable-server-action-ids.md): reload to get the new version.
  const outdated = unstable_isUnrecognizedActionError(error);

  useEffect(() => {
    if (outdated) {
      window.location.reload();
    }
  }, [outdated]);

  if (outdated) {
    return (
      <div className="readable">
        <p role="status">{t('updated')}</p>
      </div>
    );
  }

  return (
    <div className="readable">
      <h1>{t('title')}</h1>
      <p>{t('text')}</p>
      <p>
        <button type="button" onClick={reset}>
          {t('retry')}
        </button>
      </p>
    </div>
  );
}
