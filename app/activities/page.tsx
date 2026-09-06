import { redirect } from 'next/navigation';

export default function ActivitiesPage() {
  redirect('/explore?tab=activities');
}
