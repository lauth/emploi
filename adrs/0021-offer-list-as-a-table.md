# 21. Offer list as a table, controls in the column headers

- Status: Accepted
- Date: 2026-10-06
- Amends ADR-0020 (front only: how the filters, sort and page size are shown; the URL state and the API are unchanged)

## Context

ADR-0020 put every list control (search, period, sort select, page size, apply/reset) in a large bordered form above a list of cards, inside a 48rem column. The user wants the page to use the width of the screen, the offers in a table with the sorting and filtering controls in the column headers, and a search area that takes less room.

## Decision

- **Width.** The app's main area spans the screen (up to 120rem). Reading pages and forms (offer detail, add/edit forms, error pages) keep a 48rem column through a `.readable` wrapper, for line length.
- **Table.** The offers are an HTML `<table>` (columns: title, company, location, application date, date added) built from a new design system `Table` component. It scrolls sideways on narrow screens inside a named, keyboard-focusable region, and its caption (visually hidden) says how the table is sorted.
- **Sorting from the headers.** A sortable column header is a link to the list sorted by that column: the first click uses the field's natural direction (dates newest first, text A to Z), a second click reverses it. The `<th>` carries `aria-sort`, which drives the arrow. Links, not buttons: the state stays in the URL (ADR-0020) and it works without JavaScript. The sort select is gone.
- **Period filter in its header.** The application date header has a "Filtrer" button opening a small GET form (from/to dates) in a design system `Popover`, built on the native HTML `popover` attribute: no JavaScript, closes on Escape or outside click, and placed under its button with CSS anchor positioning where supported (centred otherwise). An active period shows above the table as a removable chip, and the button is highlighted.
- **Compact search.** One line next to the page title: a search field with a visually hidden label (a new `labelHidden` option of the design system fields, used only where a nearby button names the purpose) and a "Rechercher" button, plus "Réinitialiser" when a filter is active. GET forms carry the rest of the state as hidden inputs (`keptFields`) and go back to page 1.
- **Page size** is a row of links (10 · 20 · 50) under the table, next to the count and the pagination.

## Consequences

- The list uses the screen width; long titles wrap in the first column, the other columns stay compact.
- Everything still lives in the URL and works without JavaScript; no new dependency.
- Firefox without anchor positioning shows the period popover centred in the viewport: acceptable, and it still works.
- Adding a sortable column means a header link plus the field in the `Record` of natural directions (`FIELD_ORDERS`); adding a filter to another column reuses `Popover` and `keptFields`.
