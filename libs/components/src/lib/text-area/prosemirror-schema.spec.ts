import { markdownParser, markdownSerializer } from './prosemirror-schema';

describe('prosemirror mention schema', () => {
  it('parses and serializes user and issue mentions', () => {
    const md = 'Hello @alice and task #TASK-2223 end';
    const doc = markdownParser.parse(md);
    const json = doc.toJSON();
    const types = JSON.stringify(json);
    expect(types).toContain('mention_user');
    expect(types).toContain('mention_issue');
    expect(types).toContain('"username":"alice"');
    expect(types).toContain('"key":"TASK-2223"');
    const out = markdownSerializer.serialize(doc);
    expect(out).toContain('@alice');
    expect(out).toContain('#TASK-2223');
  });

  it('does not put mentions inside code_block', () => {
    const md = '```\n@alice #TASK-1\n```';
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).not.toContain('mention_user');
    expect(json).not.toContain('mention_issue');
    expect(json).toContain('code_block');
  });

  it('parses headings lists and bold', () => {
    const md = '# Title\n\n**bold**\n\n- one\n- two';
    const doc = markdownParser.parse(md);
    expect(doc.childCount).toBeGreaterThan(0);
    expect(markdownSerializer.serialize(doc)).toContain('Title');
  });
});
