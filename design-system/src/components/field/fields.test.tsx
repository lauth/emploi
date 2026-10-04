import { render, screen } from '@testing-library/react';
import { SelectField } from './select-field';
import { TextAreaField } from './text-area-field';
import { TextField } from './text-field';

describe('TextField', () => {
  it('is labelled, with a generated id', () => {
    render(<TextField label="Lieu" name="location" />);

    const input = screen.getByLabelText('Lieu');
    expect(input).toHaveAttribute('name', 'location');
    expect(input.id).not.toBe('');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('uses the given id', () => {
    render(<TextField label="Lieu" id="location" />);

    expect(screen.getByLabelText('Lieu')).toHaveAttribute('id', 'location');
  });

  it('describes the input with its hint and error, and marks it invalid', () => {
    render(
      <TextField
        label="Lien"
        hint="L’adresse de l’annonce"
        error="Adresse invalide"
      />,
    );

    const input = screen.getByLabelText('Lien');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'L’adresse de l’annonce Adresse invalide',
    );
  });

  it('passes native attributes to the input', () => {
    render(
      <TextField label="Date" type="date" required defaultValue="2026-10-04" />,
    );

    const input = screen.getByLabelText('Date');
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toBeRequired();
    expect(input).toHaveValue('2026-10-04');
  });
});

describe('TextAreaField', () => {
  it('is a labelled textarea that can be invalid', () => {
    render(<TextAreaField label="Notes" error="Trop long" />);

    const textarea = screen.getByLabelText('Notes');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAccessibleDescription('Trop long');
  });
});

describe('SelectField', () => {
  it('lists the options and selects the default value', () => {
    render(
      <SelectField
        label="Statut"
        defaultValue="b"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );

    expect(screen.getByLabelText('Statut')).toHaveValue('b');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'A',
      'B',
    ]);
  });
});
