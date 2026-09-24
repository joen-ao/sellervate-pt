import { Inbox } from 'lucide-react';

type Props = { title: string; body?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode };

// A designed "nothing here": says why it is empty and what to do next.
export function EmptyState({ title, body, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-box bg-base-200/60 px-6 py-14 text-center">
      <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-base-300 text-base-content/60">
        {icon ?? <Inbox size={18} strokeWidth={1.75} />}
      </span>
      <p className="text-base font-medium">{title}</p>
      {body && <div className="max-w-md text-sm leading-relaxed text-base-content/60">{body}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
