import type { InterviewStep } from '@emploi/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getInterviewStep } from '@/lib/api';
import type { InterviewStepFormValues } from '@/lib/interview-step-form';
import { updateInterviewStepAction } from '../../actions';
import { InterviewStepForm } from '../../interview-step-form';

/** Deduplicated per request: used by both `generateMetadata` and the page. */
const loadStep = cache(getInterviewStep);

type Props = PageProps<'/offers/[id]/steps/[stepId]/edit'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, stepId } = await params;
  const step = await loadStep(id, stepId);
  return { title: `Edit ${step?.title ?? 'step'} · emploi` };
}

export default async function EditInterviewStepPage({ params }: Props) {
  const { id, stepId } = await params;
  const step = await loadStep(id, stepId);
  if (step === null) {
    notFound();
  }

  return (
    <>
      <h1>Edit the interview step</h1>
      <InterviewStepForm
        action={updateInterviewStepAction.bind(null, step.offerId, step.id)}
        initialValues={toFormValues(step)}
        submitLabel="Save"
        cancelHref={`/offers/${step.offerId}`}
      />
    </>
  );
}

function toFormValues(step: InterviewStep): InterviewStepFormValues {
  return {
    title: step.title,
    date: step.date ?? '',
    status: step.status,
    description: step.description ?? '',
  };
}
