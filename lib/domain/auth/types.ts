import type { AccountId } from '@ks/lib/domain/ids/types.ts';

/** Who a session belongs to. */
export type Session = { accountId: AccountId; email: string };

/** A stored session: only the SHA-256 of its token, never the token. */
export type SessionRow = {
  createdAt: Date;
  expiresAt: Date;
  tokenHash: string;
} & Session;

/** Where sessions are kept. `accountId` must be an existing Account's id. */
export type SessionStore = {
  add: (row: SessionRow) => Promise<void>;
  find: (tokenHash: string) => Promise<SessionRow | undefined>;
  remove: (tokenHash: string) => Promise<void>;
  /** Deletes every row whose `expiresAt` is at or before `now`. */
  removeExpired: (now: Date) => Promise<void>;
  renew: (tokenHash: string, expiresAt: Date) => Promise<void>;
};

/** Turns an email and password into the sign-in provider's issuer and subject, or undefined if refused. */
export type SignInPort = {
  /** Throws, naming no credential, when the provider can't answer. */
  verify: (
    email: string,
    password: string
  ) => Promise<{ issuer: string; subject: string } | undefined>;
};

/** Where failed sign-ins are kept, by `emailKey`: a hash, never the email. */
export type ThrottleStore = {
  add: (emailKey: string, failedAt: Date) => Promise<void>;
  /** Deletes one failure for `emailKey` at exactly `failedAt`, if there is one. */
  remove: (emailKey: string, failedAt: Date) => Promise<void>;
  /** Deletes every failure before `before`, for all emails. */
  removeBefore: (before: Date) => Promise<void>;
  /** The failures for `emailKey` at or after `since`, oldest first. */
  since: (emailKey: string, since: Date) => Promise<Date[]>;
};
