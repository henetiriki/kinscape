/** The letter an Avatar shows for an Account: an Account has no name, so it is the first letter of the email. */
export const accountInitial = (email: string): string =>
  email.charAt(0).toUpperCase();
