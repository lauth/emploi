import {
  Badge,
  Button,
  buttonClassName,
  Card,
  type BadgeTone,
} from '@emploi/design-system';
import type { InterviewStep, InterviewStepStatus } from '@emploi/shared';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/format';
import { ConfirmButton } from '../confirm-button';
import styles from '../offers.module.css';
import {
  deleteInterviewStepAction,
  moveInterviewStepAction,
} from './steps/actions';

/** Colour of each status; the label carries the meaning too. */
const STATUS_TONES: Record<InterviewStepStatus, BadgeTone> = {
  planned: 'info',
  pending: 'warning',
  passed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

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
          className={buttonClassName()}
        >
          {t('steps.add')}
        </Link>
      </div>

      {steps.length === 0 ? (
        <p className={styles.empty}>{t('steps.empty')}</p>
      ) : (
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <Card as="li" key={step.id}>
              <div className={styles.stepHeading}>
                <h3>{step.title}</h3>
                <Badge tone={STATUS_TONES[step.status]}>
                  {t(`steps.status.${step.status}`)}
                </Badge>
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
                  className={buttonClassName({ size: 'sm' })}
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
                    <Button type="submit" size="sm">
                      {t('steps.moveUp')}
                    </Button>
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
                    <Button type="submit" size="sm">
                      {t('steps.moveDown')}
                    </Button>
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
                  variant="danger"
                  size="sm"
                />
              </div>
            </Card>
          ))}
        </ol>
      )}
    </section>
  );
}
