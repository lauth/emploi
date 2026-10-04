import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';

const preview: Preview = {
  // A documentation page per component, generated from its stories and props.
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Accessibility violations fail story tests, not just show up in the panel.
    a11y: { test: 'error' },
  },
};

export default preview;
