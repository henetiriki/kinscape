/** The server action behind the form. It redirects on success, so it returns only a failure. */
export type SignInAction = (
  state: SignInState,
  data: FormData
) => Promise<SignInState>;

/** What a sign-in left on the form: nothing yet, wrong details, or Auth not answering. */
export type SignInState = 'refused' | 'unavailable' | undefined;
