import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmButton } from './confirm-button';

function renderButton(action: () => Promise<void>) {
  render(
    <ConfirmButton
      action={action}
      confirmMessage="Delete it?"
      label="Delete"
      pendingLabel="Deleting…"
    />,
  );
}

describe('ConfirmButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the action once confirmed', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const action = vi.fn(() => Promise.resolve());
    renderButton(action);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirm).toHaveBeenCalledWith('Delete it?');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does nothing when cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const action = vi.fn(() => Promise.resolve());
    renderButton(action);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(action).not.toHaveBeenCalled();
  });
});
