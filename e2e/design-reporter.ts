import type { Reporter, TestCase } from '@playwright/test/reporter';

import { appendFileSync } from 'node:fs';

import config from '../design/screens.json' with { type: 'json' };
import { type Result, summarise } from '../lib/design/check.mts';

/** Writes the design check table to the job summary (and the terminal). */
export default class DesignReporter implements Reporter {
  private results: Result[] = [];

  onEnd = () => {
    if (this.results.length === 0) return;

    const table = summarise(this.results, config.threshold);

    console.log(`\n${table}\n`);

    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
    }
  };

  onTestEnd = (test: TestCase) => {
    for (const note of test.annotations) {
      if (note.type === 'design-result' && note.description) {
        this.results.push(JSON.parse(note.description));
      }
    }
  };
}
