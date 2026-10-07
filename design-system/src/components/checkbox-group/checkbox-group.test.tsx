import { render, screen } from '@testing-library/react';
import { CheckboxGroup } from './checkbox-group';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('CheckboxGroup', () => {
  it('is a named group of checkboxes sharing a name', () => {
    render(
      <CheckboxGroup
        legend="Lettres"
        name="letter"
        options={options}
        defaultValue={['b']}
        hint="Plusieurs choix possibles"
      />,
    );

    const group = screen.getByRole('group', { name: 'Lettres' });
    expect(group).toHaveAccessibleDescription('Plusieurs choix possibles');
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeChecked();
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toHaveAttribute('name', 'letter');
    }
  });

  it('sends one value per checked box in a form', () => {
    const { container } = render(
      <form>
        <CheckboxGroup
          legend="Lettres"
          name="letter"
          options={options}
          defaultValue={['a', 'b']}
        />
      </form>,
    );

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    expect(new FormData(form ?? undefined).getAll('letter')).toEqual([
      'a',
      'b',
    ]);
  });
});
