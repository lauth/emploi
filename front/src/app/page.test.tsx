import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('shows the app name', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'emploi' }),
    ).toBeInTheDocument();
  });
});
