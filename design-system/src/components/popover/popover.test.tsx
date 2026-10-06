import { render, screen } from '@testing-library/react';
import { Popover, popoverCloseProps } from './popover';

describe('Popover', () => {
  it('links its button to its panel with the native popover API', () => {
    const { container } = render(
      <Popover id="filters" label="Filtrer" triggerLabel="Filtrer les dates">
        <p>Panneau</p>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Filtrer les dates' });
    expect(trigger).toHaveAttribute('popovertarget', 'filters');
    expect(trigger).toHaveAttribute('type', 'button');
    const panel = container.querySelector('#filters');
    expect(panel).toHaveAttribute('popover', 'auto');
    expect(panel).toHaveTextContent('Panneau');
  });

  it('highlights its button when active', () => {
    render(
      <>
        <Popover id="a" label="A">
          <p>A</p>
        </Popover>
        <Popover id="b" label="B" active>
          <p>B</p>
        </Popover>
      </>,
    );

    expect(screen.getByRole('button', { name: 'B' }).className).not.toBe(
      screen.getByRole('button', { name: 'A' }).className,
    );
  });

  it('gives close buttons the props that hide the panel', () => {
    expect(popoverCloseProps('filters')).toEqual({
      popoverTarget: 'filters',
      popoverTargetAction: 'hide',
    });
  });
});
