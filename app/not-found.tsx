import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-2">404 — Not Found</p>
      <h1 className="text-[32px] font-bold">Lost in transit?</h1>
      <p className="mt-2 mb-6 max-w-[45ch] text-[15px] text-slate">
        We couldn&apos;t find the page you are looking for. The itinerary might have moved or the link might be broken.
      </p>
      <Link href="/">
        <Button variant="primary">Back to safety</Button>
      </Link>
    </div>
  );
}
