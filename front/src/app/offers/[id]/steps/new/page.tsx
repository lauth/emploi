import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EMPTY_INTERVIEW_STEP_FORM } from '@/lib/interview-step-form';
import { loadOffer } from '../../load-offer';
import { createInterviewStepAction } from '../actions';
import { InterviewStepForm } from '../interview-step-form';

export async function generateMetadata({
  params,
}: PageProps<'/offers/[id]/steps/new'>): Promise<Metadata> {
  const offer = await loadOffer((await params).id);
  return { title: `Add a step to ${offer?.title ?? 'an offer'} · emploi` };
}

export default async function NewInterviewStepPage({
  params,
}: PageProps<'/offers/[id]/steps/new'>) {
  const offer = await loadOffer((await params).id);
  if (offer === null) {
    notFound();
  }

  return (
    <>
      <h1>Add an interview step</h1>
      <p>{offer.title}</p>
      <InterviewStepForm
        action={createInterviewStepAction.bind(null, offer.id)}
        initialValues={EMPTY_INTERVIEW_STEP_FORM}
        submitLabel="Add the step"
        cancelHref={`/offers/${offer.id}`}
      />
    </>
  );
}
