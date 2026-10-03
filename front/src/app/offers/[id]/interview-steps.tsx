import type { InterviewStep } from '@emploi/shared';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/format';
import { ConfirmButton } from '../confirm-button';
import styles from '../offers.module.css';
import {
  deleteInterviewStepAction,
  moveInterviewStepAction,
} from './steps/actions';

/** The interview process of an offer: its steps, in order (adrs/0004). */
export async function InterviewSteps({
  offerId,
  steps,
}: {
  offerId: string;
  steps: InterviewStep[];
}) {
  const t = await getTranslations();
  const format = await getFormatter();

  return (
    <section aria-labelledby="interview-process">
      <div className={styles.sectionHeading}>
        <h2 id="interview-process">{t('steps.title')}</h2>
        <Link
          href={`/offers/${offerId}/steps/new`}
          className={styles.secondary}
        >
          {t('steps.add')}
        </Link>
      </div>

      {steps.length === 0 ? (
        <p className={styles.empty}>{t('steps.empty')}</p>
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
                  {t(`steps.status.${step.status}`)}
                </span>
              </div>
              <p className={styles.meta}>
                {step.date ? formatDate(format, step.date) : t('steps.noDate')}
              </p>
              {step.description && (
                <p className={styles.description}>{step.description}</p>
              )}

              <div className={styles.stepActions}>
                <Link
                  href={`/offers/${offerId}/steps/${step.id}/edit`}
                  className={styles.secondary}
                >
                  {t('form.edit')}
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
                      {t('steps.moveUp')}
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
                      {t('steps.moveDown')}
                    </button>
                  </form>
                )}
                <ConfirmButton
                  action={deleteInterviewStepAction.bind(
                    null,
                    offerId,
                    step.id,
                  )}
                  confirmMessage={t('steps.deleteConfirm', {
                    title: step.title,
                  })}
                  label={t('form.delete')}
                  pendingLabel={t('form.deleting')}
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
