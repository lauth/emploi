import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate, formatDateTime } from '@/lib/format';
import { deleteOfferAction } from '../actions';
import { DeleteOfferButton } from '../delete-offer-button';
import styles from '../offers.module.css';
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

  return (
    <article>
      <p>
        <Link href="/offers">← All offers</Link>
      </p>

      <div className={styles.heading}>
        <div>
          <h1>{offer.title}</h1>
          <p className={styles.meta}>
            {offer.company}
            {offer.location && ` · ${offer.location}`}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href={`/offers/${offer.id}/edit`} className={styles.secondary}>
            Edit
          </Link>
          <DeleteOfferButton action={deleteOfferAction.bind(null, offer.id)} />
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

      <h2>Description</h2>
      {offer.description ? (
        <p className={styles.description}>{offer.description}</p>
      ) : (
        <p className={styles.empty}>No description.</p>
      )}
    </article>
  );
}
