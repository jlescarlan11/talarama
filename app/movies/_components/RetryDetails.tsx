'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
export default function RetryDetails() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="btn btn-outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Retrying…' : 'Try again'}</button>;
}
