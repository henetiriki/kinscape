import { redirect } from 'next/navigation';

import { currentSession } from '@ks/server/auth/current.mts';

/**
 * The map page. The `@map` slot draws the map; this page checks the session itself, because the
 * gate rule needs a check in each page file.
 */
const Home = async () => {
  if ((await currentSession()) === undefined) {
    redirect('/sign-in');
  }

  return null;
};

export default Home;
