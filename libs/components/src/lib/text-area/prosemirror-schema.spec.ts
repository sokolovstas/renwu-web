import { DOMSerializer } from 'prosemirror-model';
import {
  markdownParser,
  markdownSerializer,
  mySchema,
  openMarkdownLinkOnClick,
} from './prosemirror-schema';

function renderMarkdownHtml(md: string): HTMLElement {
  const doc = markdownParser.parse(md);
  const wrap = document.createElement('div');
  wrap.appendChild(
    DOMSerializer.fromSchema(mySchema).serializeFragment(doc.content),
  );
  return wrap;
}

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

  it('parses and serializes GFM tables', () => {
    const md = `| Файл | Изменение |
|------|-----------|
| swagger.yaml | +date_from |
| playlist.go | +AddedAt |`;
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).toContain('"type":"table"');
    expect(json).toContain('"type":"table_header"');
    expect(json).toContain('"type":"table_cell"');
    expect(json).toContain('swagger.yaml');
    const out = markdownSerializer.serialize(doc);
    expect(out).toContain('|');
    expect(out).toContain('swagger.yaml');
    expect(out).toContain('AddedAt');
  });

  it('keeps mentions inside table cells', () => {
    const md = `| Who | Task |
|-----|------|
| @alice | #TASK-1 |`;
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).toContain('mention_user');
    expect(json).toContain('mention_issue');
  });

  it('parses one-line GFM tables', () => {
    const md =
      '| Уровень | Файл | Действие | |---------|------|----------| | Swagger | swagger.yaml | Добавить поля | | Backend | playlist.go | Фильтр по дате |';
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).toContain('"type":"table"');
    expect(json).toContain('swagger.yaml');
    expect(json).toContain('playlist.go');
    const out = markdownSerializer.serialize(doc);
    expect(out.split('\n').length).toBeGreaterThanOrEqual(4);
    expect(out).toContain('Swagger');
  });

  it('parses one-line tables without spaces between rows', () => {
    const md = '| A | B ||---|---|| 1 | 2 || 3 | 4 |';
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).toContain('"type":"table"');
    expect(json).toContain('"text":"1"');
    expect(json).toContain('"text":"3"');
  });

  it('keeps document text for common description shapes', () => {
    const samples = [
      '## Цель\n\nОбычный текст',
      '# Hello @bob\n\nSee #TASK-1',
      '**bold** `code @alice` and @bob',
      '<p>Hello <b>world</b></p>',
      '~~strike~~',
      '- [ ] todo',
      '| A | B |\n|---|---|\n| 1 | 2 |',
      '{panel}hello{panel}',
      '```\n<table>\n@alice\n```\n\nafter',
      '> quote\n>\n> - item @user',
    ];
    for (const md of samples) {
      let doc;
      try {
        doc = markdownParser.parse(md);
      } catch (err) {
        throw new Error(`parse threw for ${JSON.stringify(md)}: ${err}`);
      }
      expect(doc.textContent.trim().length).toBeGreaterThan(0);
    }
  });

  it('parses LLM one-line table with spaced separators', () => {
    const md =
      '## Затрагиваемые файлы\n\n| Файл | Изменение | | ------ | ----------- | | swagger.yaml | +date_from, +date_to в PlaylistExportRequest; +is_set_added_at в PlaylistVideosFieldsExport | | internal/model/playlist/playlist.go | +DateFrom, +DateTo, +IsSetAddedAt в VideoCSVFilter; +AddedAt в VideoCSV | | internal/handler/http/v1/post_playlist_export_csv.go | проброс date_from/date_to/is_set_added_at | | internal/service/playlists/export_csv.go | захват AddedAt, фильтрация, запись колонки | | component/tests/playlist_test.go | тест фильтрации | | PlaylistExportPage.tsx | DatePickerRange + чекбокс + проброс | | videoAdmin.schemas.ts | регенерация типов |';
    const doc = markdownParser.parse(md);
    const json = JSON.stringify(doc.toJSON());
    expect(json).toContain('"type":"table"');
    expect(json).toContain('swagger.yaml');
    expect(json).toContain('videoAdmin.schemas.ts');
    expect(json).toContain('регенерация типов');
    // must not remain a single pipe paragraph
    expect(json).not.toContain('| Файл | Изменение | | ------ |');
  });

  it('renders markdown links with target _blank', () => {
    const html = renderMarkdownHtml(
      '[MR](https://gitlab.example/merge_requests/42)',
    );
    const a = html.querySelector('a');
    expect(a?.getAttribute('href')).toBe(
      'https://gitlab.example/merge_requests/42',
    );
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toContain('noopener');
  });

  it('turns bare urls into links', () => {
    const html = renderMarkdownHtml(
      'see https://gitlab.example/merge_requests/42 please',
    );
    const a = html.querySelector('a');
    expect(a?.getAttribute('href')).toBe(
      'https://gitlab.example/merge_requests/42',
    );
    expect(a?.getAttribute('target')).toBe('_blank');
  });

  it('opens a clicked markdown link in a new window', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    const a = document.createElement('a');
    a.href = 'https://gitlab.example/merge_requests/42';
    a.textContent = 'MR';
    const span = document.createElement('span');
    a.appendChild(span);
    const event = {
      target: span,
      button: 0,
      defaultPrevented: false,
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;

    expect(openMarkdownLinkOnClick(null, 0, event)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      a.href,
      '_blank',
      'noopener,noreferrer',
    );
    open.mockRestore();
  });
});
