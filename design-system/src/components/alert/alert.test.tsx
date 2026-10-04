import { render, screen } from '@testing-library/react';
import { Alert } from './alert';

describe('Alert', () => {
  it('interrupts screen readers for errors', () => {
    render(<Alert tone="danger">Erreur</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Erreur');
  });

  it.each(['info', 'success', 'warning'] as const)(
    'is a polite status for %s',
    (tone) => {
      render(<Alert tone={tone}>Message</Alert>);

      expect(screen.getByRole('status')).toHaveTextContent('Message');
    },
  );
});
