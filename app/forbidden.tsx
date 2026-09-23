import { StatePage } from '@/components/StatePage';

export default function Forbidden() {
  return (
    <StatePage
      code="403"
      title="This isn't yours to see"
      body="It belongs to a brand you don't cover, or to a role you don't have. If you expected to see it, switch user from the corner."
      cta={{ href: '/', label: 'Back to my work' }}
    />
  );
}
