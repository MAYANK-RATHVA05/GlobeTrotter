import { redirect } from 'next/navigation';

export default function CitiesPage() {
  redirect('/explore?tab=cities');
}
