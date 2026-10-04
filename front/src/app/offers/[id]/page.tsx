import { buttonClassName, DescriptionList } from '@emploi/design-system';
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

  const details = [
    {
      key: 'link',
      term: t('offers.detail.link'),
      description: offer.url ? (
        <a href={offer.url} target="_blank" rel="noopener noreferrer">
          {offer.url}
        </a>
      ) : (
        '—'
      ),
    },
    {
      key: 'appliedOn',
      term: t('offers.detail.appliedOn'),
      description: offer.appliedAt ? formatDate(format, offer.appliedAt) : '—',
    },
    {
      key: 'addedOn',
      term: t('offers.detail.addedOn'),
      description: formatDateTime(format, offer.createdAt),
    },
    ...(offer.updatedAt === offer.createdAt
      ? []
      : [
          {
            key: 'updatedOn',
            term: t('offers.detail.updatedOn'),
            description: formatDateTime(format, offer.updatedAt),
          },
        ]),
  ];

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
          <Link href={`/offers/${offer.id}/edit`} className={buttonClassName()}>
            {t('form.edit')}
          </Link>
          <ConfirmButton
            action={deleteOfferAction.bind(null, offer.id)}
            confirmMessage={t('offers.detail.deleteConfirm')}
            label={t('form.delete')}
            pendingLabel={t('form.deleting')}
            variant="danger"
          />
        </div>
      </div>

      <DescriptionList items={details} />

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
