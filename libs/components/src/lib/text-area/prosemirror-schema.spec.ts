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
});
