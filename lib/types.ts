import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Brand = Tables<'brands'>;
export type Profile = Tables<'profiles'>;
export type Reply = Tables<'replies'>;
export type Review = Tables<'reviews'>;

export type UserRole = Database['public']['Enums']['user_role'];
export type Severity = Database['public']['Enums']['review_severity'];
export type FailureCategory = Database['public']['Enums']['failure_category'];

export const FAILURE_CATEGORIES = [
  'wrong_facts', 'tone_off_brand', 'answered_wrong_question',
  'too_slow', 'no_order_history_check', 'incomplete',
] as const satisfies readonly FailureCategory[];

export const CATEGORY_LABEL: Record<FailureCategory, string> = {
  wrong_facts: 'Wrong facts',
  tone_off_brand: 'Off-brand tone',
  answered_wrong_question: 'Answered a different question',
  too_slow: 'Too slow',
  no_order_history_check: "Didn't check order history",
  incomplete: "Correct but won't stop them writing again",
};
