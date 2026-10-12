import { stripAgentFrontMatter } from './strip-agent-frontmatter';

describe('stripAgentFrontMatter', () => {
  it('strips dashed YAML used by AttachFrontMatter', () => {
    const input = `---
status: need_info
branch: user/ai/vkvideo-90534
mr_url: null
commits:
  - sha: abc
    message: "add endpoints"
questions:
  - "GitLab MCP 401"
  - "Frontend not implemented"
---
Flow delivery нуждается в уточнении.

Нужно уточнение:
- GitLab MCP 401
`;
    expect(stripAgentFrontMatter(input)).toBe(
      `Flow delivery нуждается в уточнении.

Нужно уточнение:
- GitLab MCP 401
`,
    );
  });

  it('strips a fenced yaml block with agent keys', () => {
    const input = `\`\`\`yaml
status: done
branch: user/ai/x
mr_url: https://gitlab.example/mr/1
commits: []
questions: []
\`\`\`
Готово.
`;
    expect(stripAgentFrontMatter(input)).toBe('Готово.\n');
  });

  it('strips bare YAML when --- was rendered away', () => {
    const input = `status: need_info
branch: user/ai/vkvideo-90534-8e4f3a78
mr_url: null
commits:

37e34f44291eccfdaa185f88897e473cc1668266: "VKVIDEO-90534: add video copy endpoints"
repo: vkgo
questions:

"GitLab MCP 401"

"Frontend not implemented"

Flow delivery нуждается в уточнении.
`;
    expect(stripAgentFrontMatter(input)).toBe(
      'Flow delivery нуждается в уточнении.\n',
    );
  });

  it('leaves ordinary markdown untouched', () => {
    const input = 'Hello **world**\n\n- one\n- two\n';
    expect(stripAgentFrontMatter(input)).toBe(input);
  });

  it('leaves dashed matter without agent keys', () => {
    const input = `---
title: Not an agent comment
---
Body
`;
    expect(stripAgentFrontMatter(input)).toBe(input);
  });

  it('strips AttachFrontMatter block followed by a blank line', () => {
    const input =
      '---\nstatus: need_info\nbranch: user/ai/x\nmr_url: null\ncommits: []\nquestions: []\n---\n\nFlow delivery нуждается в уточнении.';
    expect(stripAgentFrontMatter(input)).toBe(
      'Flow delivery нуждается в уточнении.',
    );
  });
});
