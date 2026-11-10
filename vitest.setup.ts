import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { standInDom } from '@ks/__tests__/dom-stand-ins';

// Vitest has no globals here, so Testing Library can't unmount between tests by itself.
afterEach(cleanup);

standInDom(window);
