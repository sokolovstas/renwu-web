import { readFileSync } from 'fs';
import { join } from 'path';

describe('JiraComponent template', () => {
  it('has Sync now in the auto-import section', () => {
    const html = readFileSync(join(__dirname, 'jira.component.html'), 'utf8');
    expect(html).toMatch(
      /jira-import-auto[\s\S]*importJql\(\)[\s\S]*'settings\.jira-sync-now' \| transloco/,
    );
  });
});
