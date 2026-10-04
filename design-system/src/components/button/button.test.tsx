import { render, screen } from '@testing-library/react';
import { Button, buttonClassName } from './button';

describe('Button', () => {
  it('is a plain button by default, not a submit button', () => {
    render(<Button>Annuler</Button>);

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('can submit a form', () => {
    render(<Button type="submit">Enregistrer</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('keeps extra classes', () => {
    render(<Button className="extra">Ok</Button>);

    expect(screen.getByRole('button')).toHaveClass('extra');
  });
});

describe('buttonClassName', () => {
  it('differs by variant', () => {
    expect(buttonClassName({ variant: 'primary' })).not.toBe(
      buttonClassName({ variant: 'danger' }),
    );
  });
});
