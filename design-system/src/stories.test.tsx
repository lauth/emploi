import { composeStories, type Meta, type StoryFn } from '@storybook/react-vite';

// Every story is a test: it renders without errors, its `play` function passes,
// and the accessibility checks find no violation (a11y.test = 'error').

interface StoryFile {
  default: Meta;
  [name: string]: StoryFn | Meta;
}

const files = import.meta.glob<StoryFile>('./**/*.stories.tsx', {
  eager: true,
});

describe.each(Object.entries(files))('%s', (_path, file) => {
  const stories = Object.values(composeStories(file)).map(
    (Story) => [Story.storyName, Story] as const,
  );

  it.each(stories)('%s', async (_name, Story) => {
    await Story.run();
  });
});
