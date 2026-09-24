import Link from 'next/link';

// The product's name with its one touch of colour: the clay square (accent is
// reserved for this mark, DESIGN.md).
export function BrandMark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex w-fit items-center gap-2.5 rounded-field text-sm font-semibold tracking-tight">
      <span aria-hidden className="flex size-6 items-center justify-center rounded-[0.4rem] bg-accent text-[13px] font-bold text-accent-content">
        S
      </span>
      Sellervate QA
    </Link>
  );
}
