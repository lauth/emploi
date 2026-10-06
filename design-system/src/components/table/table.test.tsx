import { render, screen } from '@testing-library/react';
import { Table } from './table';

describe('Table', () => {
  it('is named by its caption, also when the caption is hidden', () => {
    render(
      <Table caption="Offres">
        <tbody>
          <tr>
            <td>Développeur</td>
          </tr>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole('table', { name: 'Offres' })).toBeInTheDocument();
    // The scrolling region is keyboard reachable and named too.
    const region = screen.getByRole('region', { name: 'Offres' });
    expect(region).toHaveAttribute('tabindex', '0');
  });
});
