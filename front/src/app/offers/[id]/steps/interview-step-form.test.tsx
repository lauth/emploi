import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMPTY_INTERVIEW_STEP_FORM,
  readInterviewStepForm,
  type InterviewStepFormState,
} from '@/lib/interview-step-form';
import { renderWithIntl } from '@/test/intl';
import { InterviewStepForm } from './interview-step-form';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

type Action = (
  state: InterviewStepFormState,
  formData: FormData,
) => Promise<InterviewStepFormState>;

function renderForm(action: Action, initialValues = EMPTY_INTERVIEW_STEP_FORM) {
  renderWithIntl(
    <InterviewStepForm
      action={action}
      initialValues={initialValues}
      submitLabel="Enregistrer"
      cancelHref="/offers/1"
    />,
  );
}

describe('InterviewStepForm', () => {
  it('defaults the status to planned and lists every status in French', () => {
    renderForm(vi.fn<Action>());

    expect(screen.getByLabelText('Statut')).toHaveValue('planned');
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual([
      'Prévue',
      'En attente de réponse',
      'Validée',
      'Refusée',
      'Annulée',
    ]);
  });

  it('submits the typed values to the action', async () => {
    const submitted: FormData[] = [];
    renderForm((state, formData) => {
      submitted.push(formData);
      return Promise.resolve(state);
    });

    await userEvent.type(screen.getByLabelText('Étape'), 'Test technique');
    await userEvent.selectOptions(screen.getByLabelText('Statut'), 'pending');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get('title')).toBe('Test technique');
    expect(submitted[0]?.get('status')).toBe('pending');
  });

  it('shows the errors returned by the action and keeps the values', async () => {
    renderForm((_state, formData) =>
      Promise.resolve({
        values: readInterviewStepForm(formData),
        fieldErrors: { date: ['Saisissez une date valide'] },
        formErrors: ['Cette offre ou cette étape n’existe plus.'],
      }),
    );

    await userEvent.type(screen.getByLabelText('Étape'), 'Appel');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cette offre ou cette étape n’existe plus.',
    );
    expect(screen.getByLabelText('Date')).toHaveAccessibleDescription(
      'Saisissez une date valide',
    );
    expect(screen.getByLabelText('Étape')).toHaveValue('Appel');
  });
});
