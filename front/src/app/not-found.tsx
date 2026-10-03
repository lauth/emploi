import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p>
        This page doesn&apos;t exist.{' '}
        <Link href="/offers">Back to the offers</Link>
      </p>
    </>
  );
}
