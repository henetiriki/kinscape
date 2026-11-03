/** Turns an email and password into the sign-in provider's subject, or undefined if refused. */
export type SessionPort = {
  /** Throws, naming no credential, when the provider can't answer. */
  verify: (email: string, password: string) => Promise<string | undefined>;
};
