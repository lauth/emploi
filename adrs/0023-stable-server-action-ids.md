# 23. Stable Server Action ids across deployments

- Status: Accepted
- Date: 2026-10-07

## Context

After a deploy, a page opened with the previous version failed as soon as the user submitted a form: "Failed to find Server Action … This request might be from an older or newer deployment", shown as the generic error page ("L'API est peut-être indisponible"), and the input was lost.

A Server Action id is a hash of the action's file and export name, salted with `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, the key that also encrypts the arguments bound to actions (e.g. the offer id in `updateOfferAction.bind(null, id)`). Without that variable, `next build` generates a new key, and the Docker build has no `.next` cache to reuse one, so every image had new action ids: every open page broke at each deploy.

Next.js's `deploymentId` doesn't fix this: it makes client-side navigations do a full reload when the version changes, but the server doesn't check it on Server Action requests, which still fail. Navigations are already handled without it (build id check).

## Decision

- Build the front with a **fixed** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. Same key and same action file and name give the same id (checked by building twice), so a form opened before a deploy still submits to the new version, and its encrypted bound arguments still decrypt.
- The key is local and never committed: `make images` generates it once (`openssl rand -base64 32`) into `.secrets/next-server-actions.key` (git- and docker-ignored) and passes it to `docker build` as a **BuildKit secret** (`RUN --mount=type=secret,…,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`), so it isn't in the image history or environment. Next.js embeds it in the build output, where the server reads it. This is the images' only build input; it is not configuration (nothing to set per environment).
- Fallback for an action removed or renamed between versions: the root error boundary (`src/app/error.tsx`) recognises `unstable_isUnrecognizedActionError` and reloads the page, with a "the application has just been updated" message, instead of the API error.

## Consequences

- Deploys no longer break open pages, except when an action was removed or renamed (the page then reloads once; that form's input is lost).
- An action whose arguments change shape still receives old submissions until the page is reloaded: actions validate their input anyway (ADR-0012, Zod).
- Deleting `.secrets/next-server-actions.key` (or a new machine) means a new key: open pages break once at the next deploy, then reload.
- `unstable_isUnrecognizedActionError` is an unstable Next.js API: an upgrade may rename it, which the type check will report.
