'use server';

import { redirect } from 'next/navigation';
import { nextUnreviewedReplyId } from '@/lib/data/replies';
import { runPage } from '@/lib/page';

// "Review next": oldest reply the lead has not reviewed, in the brand filter if any.
// The brand field is untrusted input; nextUnreviewedReplyId resolves it through membership (403/404).
export async function goNext(form: FormData) {
  const raw = form.get('brand');
  const brand = typeof raw === 'string' && raw ? raw : undefined;
  const id = await runPage(() => nextUnreviewedReplyId(brand));
  redirect(id ? `/reviews/${id}` : `/queue?caught_up=1${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`);
}
