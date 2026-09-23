import { StatePage } from '@/components/StatePage';
import { UserSwitcher } from '@/components/UserSwitcher';
import { listSwitchableUsers } from '@/lib/current-user';

export default async function SwitchNeeded() {
  const users = await listSwitchableUsers();
  return (
    <StatePage
      title="Pick who you are"
      body="Login is stubbed in this build. Choose a person to use the tool as them — what they can see is still decided on the server, by the brands they cover."
    >
      <UserSwitcher users={users} current={null} variant="inline" />
    </StatePage>
  );
}
