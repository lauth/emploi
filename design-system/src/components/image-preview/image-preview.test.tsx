import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from './image-preview';

describe('ImagePreview', () => {
  // jsdom has no modal dialogs: record the calls instead.
  const showModal = vi.fn();
  const close = vi.fn();

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderPreview() {
    return render(
      <ImagePreview
        src="/offers/1/image"
        alt="Capture de l’annonce"
        openLabel="Agrandir l’image"
        closeLabel="Fermer"
      />,
    );
  }

  it('shows a thumbnail button named after what it does', () => {
    const { container } = renderPreview();

    const thumbnail = screen.getByRole('button', { name: 'Agrandir l’image' });
    expect(thumbnail.querySelector('img')).toHaveAttribute(
      'src',
      '/offers/1/image',
    );
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('opens the full image in a modal dialog, and closes it', async () => {
    const { container } = renderPreview();

    await userEvent.click(
      screen.getByRole('button', { name: 'Agrandir l’image' }),
    );
    expect(showModal).toHaveBeenCalledOnce();

    const dialog = container.querySelector('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Capture de l’annonce');
    expect(dialog).toHaveAttribute('closedby', 'any');
    expect(
      dialog?.querySelector('img[alt="Capture de l’annonce"]'),
    ).toHaveAttribute('src', '/offers/1/image');

    await userEvent.click(
      screen.getByRole('button', { name: 'Fermer', hidden: true }),
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
