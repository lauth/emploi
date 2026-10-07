import { screen } from '@testing-library/react';
import { unstable_isUnrecognizedActionError } from 'next/navigation';
import { renderWithIntl } from '@/test/intl';
import ErrorPage from './error';

vi.mock('next/navigation', () => ({
  unstable_isUnrecognizedActionError: vi.fn(),
}));

const reload = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  // jsdom's location.reload can't be spied on: replace location with a stub.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload },
  });
});

describe('ErrorPage', () => {
  it('says the page could not be loaded and offers to retry', () => {
    vi.mocked(unstable_isUnrecognizedActionError).mockReturnValue(false);

    renderWithIntl(<ErrorPage error={new Error('API down')} reset={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Une erreur est survenue' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads the page when a Server Action is from an older deployment', () => {
    vi.mocked(unstable_isUnrecognizedActionError).mockReturnValue(true);

    renderWithIntl(
      <ErrorPage error={new Error('not found')} reset={vi.fn()} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'L’application vient d’être mise à jour : rechargement de la page…',
    );
    expect(reload).toHaveBeenCalledOnce();
  });
});
