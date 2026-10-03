'use client';

/** Shown when rendering fails, e.g. when the API is unreachable. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p>The page could not be loaded. The API may be unavailable.</p>
      <p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </p>
    </>
  );
}
