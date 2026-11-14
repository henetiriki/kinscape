import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

/** What a save action returns: the saved Person, or why nothing was saved. */
export type SaveResult = Result<
  PersonView,
  'conflict' | 'invalid' | 'not-found' | PersonFieldErrors
>;
