import type { Meta, StoryObj } from '@storybook/react-vite';

/** The colour tokens of `src/styles/tokens.css`, in the current theme. */
const COLOR_TOKENS = [
  ['--color-background', 'Page background'],
  ['--color-surface', 'Cards and panels'],
  ['--color-text', 'Text'],
  ['--color-text-muted', 'Secondary text'],
  ['--color-border', 'Borders'],
  ['--color-accent', 'Links and primary actions'],
  ['--color-on-accent', 'Text on the accent colour'],
  ['--color-info', 'Information'],
  ['--color-success', 'Success'],
  ['--color-warning', 'Warning'],
  ['--color-danger', 'Errors and destructive actions'],
  ['--color-neutral', 'Neutral status'],
] as const;

function ColorTokens() {
  return (
    <table style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th scope="col">Swatch</th>
          <th scope="col">Token</th>
          <th scope="col">Use</th>
        </tr>
      </thead>
      <tbody>
        {COLOR_TOKENS.map(([token, use]) => (
          <tr key={token}>
            <td style={{ padding: '0.25rem 1rem 0.25rem 0' }}>
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: '3rem',
                  height: '1.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: `var(${token})`,
                }}
              />
            </td>
            <td style={{ paddingRight: '1rem' }}>
              <code>{token}</code>
            </td>
            <td>{use}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta = {
  title: 'Foundations/Colors',
  component: ColorTokens,
  parameters: {
    docs: {
      description: { component: 'Switch the OS theme to see the dark values.' },
    },
  },
} satisfies Meta<typeof ColorTokens>;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
