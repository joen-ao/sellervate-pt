type Props = { title: string; body?: React.ReactNode; action?: React.ReactNode };

// A designed "nothing here": says why it is empty and what to do next.
export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-box border border-dashed border-base-300 px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      {body && <div className="max-w-md text-sm text-base-content/70">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
