'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SharedTripRedirect() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const router = useRouter();

  useEffect(() => {
    if (shareId) router.replace(`/s/${shareId}`);
  }, [shareId, router]);

  return null;
}
