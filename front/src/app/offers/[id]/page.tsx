import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  return { title: `${offer?.title ?? 'Offer'} · emploi` };
}

export default async function OfferPage({ params }: PageProps<'/offers/[id]'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }
  const steps = await listInterviewSteps(offer.id);

  return (
    <article>
      <p>
        <Link href="/offers">← All offers</Link>
      </p>

      <div className={styles.heading}>
        <div>
          <h1>{offer.title}</h1>
          <CompanyAndLocation offer={offer} />
        </div>
        <div className={styles.actions}>
          <Link href={`/offers/${offer.id}/edit`} className={styles.secondary}>
            Edit
          </Link>
          <ConfirmButton
            action={deleteOfferAction.bind(null, offer.id)}
            confirmMessage="Delete this offer and its interview steps? This cannot be undone."
            label="Delete"
            pendingLabel="Deleting…"
            className={styles.danger}
          />
        </div>
      </div>

      <dl className={styles.details}>
        <dt>Link</dt>
        <dd>
          {offer.url ? (
            <a href={offer.url} target="_blank" rel="noopener noreferrer">
              {offer.url}
            </a>
          ) : (
            '—'
          )}
        </dd>
        <dt>Applied on</dt>
        <dd>{offer.appliedAt ? formatDate(offer.appliedAt) : '—'}</dd>
        <dt>Added on</dt>
        <dd>{formatDateTime(offer.createdAt)}</dd>
        {offer.updatedAt !== offer.createdAt && (
          <>
            <dt>Updated on</dt>
            <dd>{formatDateTime(offer.updatedAt)}</dd>
          </>
        )}
      </dl>

      <InterviewSteps offerId={offer.id} steps={steps} />

      <h2>Description</h2>
      {offer.description ? (
        <p className={styles.description}>{offer.description}</p>
      ) : (
        <p className={styles.empty}>No description.</p>
      )}
    </article>
  );
}
