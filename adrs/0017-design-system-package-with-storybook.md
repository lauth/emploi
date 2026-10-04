# 17. Design system package with Storybook

- Status: Accepted
- Date: 2026-10-04

## Context

The front's look lives in page-level CSS modules (`offers.module.css`) and small ad-hoc components (form fields, buttons, badges). Each new feature copies classes and markup, and nothing shows the available building blocks in one place. The user wants a separate design system holding the basic components, presented with Storybook.

## Decision

- A workspace package, **`@emploi/design-system`** in `design-system/`, holds:
  - the **design tokens**: CSS custom properties for colours, spacing, radii and typography, with a light and a dark theme (`prefers-color-scheme`);
  - the **base styles** (reset, body, headings, links);
  - the **basic components**: `Button` (and `buttonClassName` for links), `TextField`, `TextAreaField`, `SelectField`, `Badge`, `Card`, `Alert`, `DescriptionList`.
- Components are **presentational and app-agnostic**: React and CSS Modules only. No Next.js imports (links take the class from `buttonClassName`), no data fetching, and **no built-in text**: every label or message comes through props, so translations stay in the front (ADR-0016).
- Components are **accessible by construction**: form fields always render a label, link errors and hints with `aria-describedby` and set `aria-invalid`; alerts use `role="alert"`.
- **No build step**, like `@emploi/shared` (ADR-0009): the package exports its TypeScript sources and CSS; Next compiles it (`transpilePackages`), and so do Storybook and Vitest (Vite).
- **Storybook** (`@storybook/react-vite`) presents every component with its variants and states, generated docs, and the accessibility addon. Run it with `make storybook` (http://localhost:6006); `make storybook-build` builds the static site.
- **Every story is also a test**: a Vitest suite renders all stories (portable stories) and fails on errors, alongside unit tests of the components' behaviour. Both run in `make check`, as do lint and type checks.
- The front uses the design system for every basic element; its own CSS only lays out pages (grids, spacing between sections).

## Consequences

- A new feature composes existing components; a new basic component is added to the design system with its stories and tests first.
- Visual changes are reviewed in Storybook, in isolation from data and the cluster.
- Storybook adds development dependencies; it is not deployed, it runs locally. Publishing it (e.g. at `storybook.emploi.localhost`) can be decided later.
- Changing a component affects every page using it: the browser tests (ADR-0013) cover the main flows.
