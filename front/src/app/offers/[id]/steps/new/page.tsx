import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EMPTY_INTERVIEW_STEP_FORM } from '@/lib/interview-step-form';
import { loadOffer } from '../../load-offer';
import { createInterviewStepAction } from '../actions';
import { InterviewStepForm } from '../interview-step-form';

export async function generateMetadata({
  params,
}: PageProps<'/offers/[id]/steps/new'>): Promise<Metadata> {
  const offer = await loadOffer((await params).id);
  const t = await getTranslations('steps.new');
  return {
    title: offer ? t('metaTitle', { offer: offer.title }) : t('title'),
  };
}

export default async function NewInterviewStepPage({
  params,
}: PageProps<'/offers/[id]/steps/new'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }
  const t = await getTranslations('steps.new');

  return (
    <>
      <h1>{t('title')}</h1>
      <p>{offer.title}</p>
      <InterviewStepForm
        action={createInterviewStepAction.bind(null, offer.id)}
        initialValues={EMPTY_INTERVIEW_STEP_FORM}
        submitLabel={t('submit')}
        cancelHref={`/offers/${offer.id}`}
      />
    </>
  );
}
