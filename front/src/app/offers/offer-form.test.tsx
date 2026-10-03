import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMPTY_OFFER_FORM,
  readOfferForm,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import { OfferForm } from './offer-form';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const values: OfferFormValues = {
  title: 'Backend developer',
  company: 'Acme',
  url: 'https://jobs.example.com/42',
  location: 'Lyon',
  description: 'Node.js',
  appliedAt: '2026-09-28',
};

function renderForm(
  action: (
    state: OfferFormState,
    formData: FormData,
  ) => Promise<OfferFormState>,
  initialValues = EMPTY_OFFER_FORM,
) {
  render(
    <OfferForm
      action={action}
      initialValues={initialValues}
      submitLabel="Save"
      cancelHref="/offers"
    />,
  );
}

describe('OfferForm', () => {
  it('shows the initial values', () => {
    renderForm(vi.fn(), values);

    expect(screen.getByLabelText('Title')).toHaveValue('Backend developer');
    expect(screen.getByLabelText('Company')).toHaveValue('Acme');
    expect(screen.getByLabelText('Link to the offer')).toHaveValue(
      'https://jobs.example.com/42',
    );
    expect(screen.getByLabelText('Location')).toHaveValue('Lyon');
    expect(screen.getByLabelText('Applied on')).toHaveValue('2026-09-28');
    expect(screen.getByLabelText('Description')).toHaveValue('Node.js');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/offers',
    );
  });

  it('submits the typed values to the action', async () => {
    const submitted: FormData[] = [];
    const action = vi.fn((state: OfferFormState, formData: FormData) => {
      submitted.push(formData);
      return Promise.resolve(state);
    });
    renderForm(action);

    await userEvent.type(screen.getByLabelText('Title'), 'Dev');
    await userEvent.type(screen.getByLabelText('Company'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get('title')).toBe('Dev');
    expect(submitted[0]?.get('company')).toBe('Acme');
  });

  it('shows the errors returned by the action and keeps the values', async () => {
    const action = vi.fn(
      (_state: OfferFormState, formData: FormData): Promise<OfferFormState> =>
        Promise.resolve({
          values: readOfferForm(formData),
          fieldErrors: { company: ['At most 200 characters'] },
          formErrors: ['The offer could not be saved. Please try again.'],
        }),
    );
    renderForm(action);

    await userEvent.type(screen.getByLabelText('Title'), 'Dev');
    await userEvent.type(screen.getByLabelText('Company'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The offer could not be saved. Please try again.',
    );
    const company = screen.getByLabelText('Company');
    expect(company).toHaveAttribute('aria-invalid', 'true');
    expect(company).toHaveAccessibleDescription('At most 200 characters');
    expect(screen.getByLabelText('Title')).toHaveValue('Dev');
  });
});
