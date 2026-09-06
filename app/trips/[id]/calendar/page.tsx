'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TripCalendarRedirect() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/trips/${id}`);
  }, [id, router]);

  return null;
}
