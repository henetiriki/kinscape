// Runs a workflow's own expressions, so the tests check what the workflow does. GitHub's syntax is a
// subset of JavaScript's for these expressions. GitHub compares strings without
// regard to case and JavaScript does not: the cases use one spelling of each value. A missing property
// gives undefined, as in GitHub, because each `.` becomes `?.`. The code under test is this repo's own
// workflow file, never input from outside, so `new Function` is safe here.
export const BOT = 'kinscape-bot[bot]';

const contains = (haystack: string | string[] | undefined, item: string) =>
  Array.isArray(haystack)
    ? haystack.includes(item)
    : String(haystack ?? '').includes(item);

const format = (template: string, ...args: string[]) =>
  template.replace(/\{(\d+)\}/g, (_, i: string) => args[Number(i)] ?? '');

export const evaluate = (source: string, github: object) => {
  const expression = source
    .replace(/^\s*\$\{\{|\}\}\s*$/g, '')
    .replace(/([A-Za-z_\]])\.(?=[A-Za-z_])/g, '$1?.');

  return new Function(
    'github',
    'vars',
    'fromJSON',
    'contains',
    'format',
    `return (${expression});`
  )(
    github,
    { KINSCAPE_BOT_LOGIN: BOT },
    JSON.parse,
    contains,
    format
  ) as unknown;
};
