import type { InterviewStep } from '@emploi/shared';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { INTERVIEW_STEP_STATUS_LABELS } from '@/lib/interview-step-form';
import { ConfirmButton } from '../confirm-button';
import styles from '../offers.module.css';
import {
  deleteInterviewStepAction,
  moveInterviewStepAction,
} from './steps/actions';

/** The interview process of an offer: its steps, in order (adrs/0004). */
export function InterviewSteps({
  offerId,
  steps,
}: {
  offerId: string;
  steps: InterviewStep[];
}) {
  return (
    <section aria-labelledby="interview-process">
      <div className={styles.sectionHeading}>
        <h2 id="interview-process">Interview process</h2>
        <Link
          href={`/offers/${offerId}/steps/new`}
          className={styles.secondary}
        >
          Add a step
        </Link>
      </div>

      {steps.length === 0 ? (
        <p className={styles.empty}>No step yet.</p>
      ) : (
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.id} className={styles.step}>
              <div className={styles.stepHeading}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <span
                  className={[styles.status, styles[step.status]]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {INTERVIEW_STEP_STATUS_LABELS[step.status]}
                </span>
              </div>
              <p className={styles.meta}>
                {step.date ? formatDate(step.date) : 'Date not set'}
              </p>
              {step.description && (
                <p className={styles.description}>{step.description}</p>
              )}

              <div className={styles.stepActions}>
                <Link
                  href={`/offers/${offerId}/steps/${step.id}/edit`}
                  className={styles.secondary}
                >
                  Edit
                </Link>
                {index > 0 && (
                  <form
                    action={moveInterviewStepAction.bind(
                      null,
                      offerId,
                      step.id,
                      'up',
                    )}
                  >
                    <button type="submit" className={styles.secondary}>
                      Move up
                    </button>
                  </form>
                )}
                {index < steps.length - 1 && (
                  <form
                    action={moveInterviewStepAction.bind(
                      null,
                      offerId,
                      step.id,
                      'down',
                    )}
                  >
                    <button type="submit" className={styles.secondary}>
                      Move down
                    </button>
                  </form>
                )}
                <ConfirmButton
                  action={deleteInterviewStepAction.bind(
                    null,
                    offerId,
                    step.id,
                  )}
                  confirmMessage={`Delete the step “${step.title}”?`}
                  label="Delete"
                  pendingLabel="Deleting…"
                  className={styles.danger}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
