import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { listInterviewSteps } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { deleteOfferAction } from '../actions';
import { CompanyAndLocation } from '../company-and-location';
import { ConfirmButton } from '../confirm-button';
import styles from '../offers.module.css';
import { InterviewSteps } from './interview-steps';
import { loadOffer } from './load-offer';

export async function generateMetadata({
  params,
}: PageProps<'/offers/[id]'>): Promise<Metadata> {
  const offer = await loadOffer((await params).id);
  const t = await getTranslations('offers.detail');
  return { title: offer?.title ?? t('metaFallback') };
}

export default async function OfferPage({ params }: PageProps<'/offers/[id]'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }
  const steps = await listInterviewSteps(offer.id);
  const t = await getTranslations();
  const format = await getFormatter();

  return (
    <article>
      <p>
        <Link href="/offers">{t('offers.detail.back')}</Link>
      </p>

      <div className={styles.heading}>
        <div>
          <h1>{offer.title}</h1>
          <CompanyAndLocation offer={offer} />
        </div>
        <div className={styles.actions}>
          <Link href={`/offers/${offer.id}/edit`} className={styles.secondary}>
            {t('form.edit')}
          </Link>
          <ConfirmButton
            action={deleteOfferAction.bind(null, offer.id)}
            confirmMessage={t('offers.detail.deleteConfirm')}
            label={t('form.delete')}
            pendingLabel={t('form.deleting')}
            className={styles.danger}
          />
        </div>
      </div>

      <dl className={styles.details}>
        <dt>{t('offers.detail.link')}</dt>
        <dd>
          {offer.url ? (
            <a href={offer.url} target="_blank" rel="noopener noreferrer">
              {offer.url}
            </a>
          ) : (
            '—'
          )}
        </dd>
        <dt>{t('offers.detail.appliedOn')}</dt>
        <dd>{offer.appliedAt ? formatDate(format, offer.appliedAt) : '—'}</dd>
        <dt>{t('offers.detail.addedOn')}</dt>
        <dd>{formatDateTime(format, offer.createdAt)}</dd>
        {offer.updatedAt !== offer.createdAt && (
          <>
            <dt>{t('offers.detail.updatedOn')}</dt>
            <dd>{formatDateTime(format, offer.updatedAt)}</dd>
          </>
        )}
      </dl>

      <InterviewSteps offerId={offer.id} steps={steps} />

      <h2>{t('offers.detail.description')}</h2>
      {offer.description ? (
        <p className={styles.description}>{offer.description}</p>
      ) : (
        <p className={styles.empty}>{t('offers.detail.noDescription')}</p>
      )}
    </article>
  );
}
