import { StatePage } from '@/components/StatePage';

export default function NotFound() {
  return (
    <StatePage
      code="404"
      title="Nothing here"
      body="That brand, reply or page doesn't exist. Check the link, or start from your own work."
      cta={{ href: '/', label: 'Back to my work' }}
    />
  );
}
