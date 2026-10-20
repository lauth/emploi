'use client';

import { Alert, Button } from '@emploi/design-system';
import type { JobAd } from '@emploi/shared';
import { useTranslations } from 'next-intl';
import { useState, useTransition, type ReactNode, type RefObject } from 'react';
import type { FetchJobAdResult } from './actions';
import styles from './offers.module.css';

interface JobAdFetcherProps {
  /** The offer form, whose fields are read and filled. */
  form: RefObject<HTMLFormElement | null>;
  /** The server action reading the ad (`fetchJobAdAction`). */
  fetchJobAd: (url: string) => Promise<FetchJobAdResult>;
  /** The link field, shown next to the button. */
  children: ReactNode;
}

/**
 * The link field with a button that reads the job ad at that link and fills
 * the form (adrs/0032-fetch-job-ad.md): the description, after a confirmation
 * when it isn't empty; title, company and location only when they're empty.
 * Nothing is saved: the user reviews the fields, then saves the form.
 */
export function JobAdFetcher({
  form,
  fetchJobAd,
  children,
}: JobAdFetcherProps) {
  const t = useTranslations('offers.jobAd');
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function read() {
    const fields = form.current?.elements;
    if (fields === undefined) {
      return;
    }
    const url = field(fields, 'url')?.value.trim() ?? '';
    if (url === '') {
      setOutcome({ ok: false, message: t('missingUrl') });
      return;
    }
    startTransition(async () => {
      const result = await fetchJobAd(url);
      if (!result.ok) {
        setOutcome({ ok: false, message: result.message });
        return;
      }
      fill(fields, result.ad, t('replaceDescription'));
      setOutcome({ ok: true, message: t('filled') });
    });
  }

  return (
    <>
      <div className={styles.withAction}>
        {children}
        <Button type="button" onClick={read} disabled={pending}>
          {pending ? t('fetching') : t('fetch')}
        </Button>
      </div>
      {outcome && (
        <Alert tone={outcome.ok ? 'success' : 'danger'}>
          {outcome.message}
        </Alert>
      )}
    </>
  );
}

type FillableField = 'title' | 'company' | 'location' | 'description';

function field(
  fields: HTMLFormControlsCollection,
  name: 'url' | FillableField,
): HTMLInputElement | HTMLTextAreaElement | null {
  const element = fields.namedItem(name);
  return element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
    ? element
    : null;
}

function fill(
  fields: HTMLFormControlsCollection,
  ad: JobAd,
  replaceQuestion: string,
) {
  // What the user already typed is kept.
  for (const name of ['title', 'company', 'location'] as const) {
    const input = field(fields, name);
    const value = ad[name];
    if (input && value !== null && input.value.trim() === '') {
      input.value = value;
    }
  }
  const description = field(fields, 'description');
  if (description && ad.description !== null) {
    const current = description.value.trim();
    if (
      current === '' ||
      current === ad.description ||
      window.confirm(replaceQuestion)
    ) {
      description.value = ad.description;
    }
  }
}
