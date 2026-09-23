import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';

export default async function Home() {
  const u = await getCurrentUser();
  redirect(!u ? '/switch-needed' : u.role === 'team_lead' ? '/queue' : '/me');
}
