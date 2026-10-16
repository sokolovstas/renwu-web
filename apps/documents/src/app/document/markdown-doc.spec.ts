import { docSchema, documentFromJSON, presentMarkdown } from './markdown-doc';

function paragraphDoc(text: string) {
  return docSchema.node('doc', null, [
    docSchema.node('paragraph', null, text ? [docSchema.text(text)] : []),
  ]);
}

describe('presentMarkdown', () => {
  it('renders markdown source stored as paragraphs', () => {
    const stored = docSchema.node('doc', null, [
      docSchema.node('paragraph', null, [
        docSchema.text('# Цель\n\nСделать **X**\n\n- один\n- два'),
      ]),
    ]);

    const doc = presentMarkdown(stored);
    const types = doc.content.content.map((node) => node.type.name);

    expect(types).toContain('heading');
    expect(types).toContain('bullet_list');
    expect(JSON.stringify(doc.toJSON())).toContain('"type":"strong"');
    expect(doc.textContent).toContain('Цель');
    expect(doc.textContent).toContain('один');
  });

  it('joins blank-line paragraphs the way the AI writer splits them', () => {
    const stored = docSchema.node('doc', null, [
      docSchema.node('paragraph', null, [docSchema.text('## Заголовок')]),
      docSchema.node('paragraph', null, [docSchema.text('Обычный текст')]),
    ]);

    const doc = presentMarkdown(stored);

    expect(doc.firstChild?.type.name).toBe('heading');
    expect(doc.firstChild?.attrs['level']).toBe(2);
    expect(doc.lastChild?.type.name).toBe('paragraph');
    expect(doc.lastChild?.textContent).toBe('Обычный текст');
  });

  it('renders a one-line table as a table', () => {
    const stored = paragraphDoc(
      '| Файл | Изменение | | --- | --- | | a.go | правка |',
    );

    const doc = presentMarkdown(stored);

    expect(JSON.stringify(doc.toJSON())).toContain('"type":"table"');
    expect(doc.textContent).toContain('a.go');
  });

  it('leaves a plain note as paragraphs', () => {
    const stored = docSchema.node('doc', null, [
      docSchema.node('paragraph', null, [docSchema.text('Просто текст')]),
      docSchema.node('paragraph', null, [docSchema.text('Вторая строка')]),
    ]);

    const doc = presentMarkdown(stored);

    expect(doc.eq(stored)).toBe(true);
  });

  it('does not reparse a document that is already structured', () => {
    const stored = docSchema.node('doc', null, [
      docSchema.node('heading', { level: 1 }, [docSchema.text('# not source')]),
      docSchema.node('paragraph', null, [docSchema.text('**остаётся текстом**')]),
    ]);

    const doc = presentMarkdown(stored);

    expect(doc.eq(stored)).toBe(true);
    expect(doc.firstChild?.type.name).toBe('heading');
  });

  it('loads stored JSON and falls back on garbage', () => {
    const doc = documentFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '# Hello' }],
        },
      ],
    });
    expect(doc.firstChild?.type.name).toBe('heading');

    const empty = documentFromJSON(null);
    expect(empty.type.name).toBe('doc');
    expect(empty.childCount).toBe(1);
  });
});
