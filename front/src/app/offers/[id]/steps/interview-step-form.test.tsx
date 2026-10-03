import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMPTY_INTERVIEW_STEP_FORM,
  readInterviewStepForm,
  type InterviewStepFormState,
} from '@/lib/interview-step-form';
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
  render(
    <InterviewStepForm
      action={action}
      initialValues={initialValues}
      submitLabel="Save"
      cancelHref="/offers/1"
    />,
  );
}

describe('InterviewStepForm', () => {
  it('defaults the status to planned and lists every status', () => {
    renderForm(vi.fn<Action>());

    const status = screen.getByLabelText('Status');
    expect(status).toHaveValue('planned');
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual([
      'Planned',
      'Waiting for an answer',
      'Passed',
      'Rejected',
      'Cancelled',
    ]);
  });

  it('submits the typed values to the action', async () => {
    const submitted: FormData[] = [];
    renderForm((state, formData) => {
      submitted.push(formData);
      return Promise.resolve(state);
    });

    await userEvent.type(screen.getByLabelText('Step'), 'Technical test');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'pending');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get('title')).toBe('Technical test');
    expect(submitted[0]?.get('status')).toBe('pending');
  });

  it('shows the errors returned by the action and keeps the values', async () => {
    renderForm((_state, formData) =>
      Promise.resolve({
        values: readInterviewStepForm(formData),
        fieldErrors: { date: ['Must be a date'] },
        formErrors: ['This offer or step no longer exists.'],
      }),
    );

    await userEvent.type(screen.getByLabelText('Step'), 'Call');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This offer or step no longer exists.',
    );
    expect(screen.getByLabelText('Date')).toHaveAccessibleDescription(
      'Must be a date',
    );
    expect(screen.getByLabelText('Step')).toHaveValue('Call');
  });
});
