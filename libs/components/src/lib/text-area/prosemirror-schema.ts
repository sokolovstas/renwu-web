import * as MarkdownItModule from 'markdown-it';
import {
  MarkdownParser,
  MarkdownSerializer,
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema as markdownSchema,
} from 'prosemirror-markdown';
import {
  DOMOutputSpec,
  Node,
  NodeSpec,
  NodeType,
  Schema,
} from 'prosemirror-model';

/** CommonMark + GFM tables (default prosemirror-markdown tokenizer has no tables). */
function createMarkdownTokenizer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = MarkdownItModule as any;
  const MarkdownIt = typeof mod === 'function' ? mod : mod.default;
  if (typeof MarkdownIt !== 'function') {
    throw new Error('markdown-it factory is unavailable');
  }
  return MarkdownIt('commonmark', { html: false }).enable('table');
}

const mentionUserSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  attrs: {
    username: {},
  },
  parseDOM: [
    {
      tag: 'span[data-mention-user]',
      getAttrs: (dom: HTMLElement) => ({
        username: dom.getAttribute('data-mention-user'),
      }),
    },
  ],
  toDOM(node: Node): DOMOutputSpec {
    return [
      'span',
      {
        'data-mention-user': node.attrs['username'],
        class: 'rw-mention rw-mention-user',
        contenteditable: 'false',
      },
      `@${node.attrs['username']}`,
    ];
  },
};

const mentionIssueSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  attrs: {
    key: {},
  },
  parseDOM: [
    {
      tag: 'span[data-mention-issue]',
      getAttrs: (dom: HTMLElement) => ({
        key: dom.getAttribute('data-mention-issue'),
      }),
    },
  ],
  toDOM(node: Node): DOMOutputSpec {
    return [
      'span',
      {
        'data-mention-issue': node.attrs['key'],
        class: 'rw-mention rw-mention-issue',
        contenteditable: 'false',
      },
      `#${node.attrs['key']}`,
    ];
  },
};

/** GFM tables — cells hold inline content (matches markdown-it tokens). */
const tableSpec: NodeSpec = {
  content: 'table_row+',
  group: 'block',
  isolating: true,
  parseDOM: [{ tag: 'table' }],
  toDOM(): DOMOutputSpec {
    return ['table', { class: 'rw-md-table' }, ['tbody', 0]];
  },
};

const tableRowSpec: NodeSpec = {
  content: '(table_cell | table_header)+',
  parseDOM: [{ tag: 'tr' }],
  toDOM(): DOMOutputSpec {
    return ['tr', 0];
  },
};

const tableCellSpec: NodeSpec = {
  content: 'inline*',
  isolating: true,
  parseDOM: [{ tag: 'td' }],
  toDOM(): DOMOutputSpec {
    return ['td', 0];
  },
};

const tableHeaderSpec: NodeSpec = {
  content: 'inline*',
  isolating: true,
  parseDOM: [{ tag: 'th' }],
  toDOM(): DOMOutputSpec {
    return ['th', 0];
  },
};

const nodesWithMentions = markdownSchema.spec.nodes.append({
  table: tableSpec,
  table_row: tableRowSpec,
  table_cell: tableCellSpec,
  table_header: tableHeaderSpec,
  mention_user: mentionUserSpec,
  mention_issue: mentionIssueSpec,
});

const headingSpec = nodesWithMentions.get('heading');

/** Markdown schema with GFM tables and @user / #ISSUE mention atoms. */
export const mySchema = new Schema({
  nodes: nodesWithMentions.update('heading', {
    content: 'inline*',
    group: headingSpec.group,
    defining: headingSpec.defining,
    parseDOM: headingSpec.parseDOM,
    toDOM: headingSpec.toDOM,
    attrs: headingSpec.attrs,
  }),
  marks: markdownSchema.spec.marks,
});

/** CommonMark + GFM tables (prosemirror-markdown default tokenizer has no tables). */
const markdownTokenizer = createMarkdownTokenizer();

// markdown-it / @types versions nested under prosemirror-markdown disagree; runtime is fine.
const rawParser = new MarkdownParser(
  mySchema,
  markdownTokenizer as ConstructorParameters<typeof MarkdownParser>[1],
  {
    ...defaultMarkdownParser.tokens,
    table: { block: 'table' },
    thead: { ignore: true },
    tbody: { ignore: true },
    tr: { block: 'table_row' },
    th: { block: 'table_header' },
    td: { block: 'table_cell' },
  },
);

const MENTION_RE =
  /(?:^|[\s(])(@([a-z0-9_]+)|#([A-Za-z][A-Za-z0-9]*(?:-\d+)?))/g;

function allowsMention(parentType: NodeType, schema: Schema): boolean {
  const userType = schema.nodes['mention_user'];
  return parentType.contentMatch.matchType(userType) != null;
}

function splitTextToMentionNodes(text: string, schema: Schema): Node[] {
  const nodes: Node[] = [];
  let last = 0;
  MENTION_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MENTION_RE.exec(text)) !== null) {
    const full = match[1];
    const at = match.index + (match[0].length - full.length);
    if (at > last) {
      nodes.push(schema.text(text.slice(last, at)));
    }
    if (match[2]) {
      nodes.push(
        (schema.nodes['mention_user'] as NodeType).create({
          username: match[2],
        }),
      );
    } else if (match[3]) {
      nodes.push(
        (schema.nodes['mention_issue'] as NodeType).create({
          key: match[3].toUpperCase(),
        }),
      );
    }
    last = at + full.length;
  }
  if (last < text.length) {
    nodes.push(schema.text(text.slice(last)));
  }
  if (!nodes.length && text) {
    nodes.push(schema.text(text));
  }
  return nodes;
}

function mapNode(node: Node, schema: Schema): Node {
  if (node.isText) {
    return node;
  }
  if (node.isTextblock) {
    const canMention = allowsMention(node.type, schema);
    const content: Node[] = [];
    node.forEach((child) => {
      if (canMention && child.isText && child.text) {
        const parts = splitTextToMentionNodes(child.text, schema);
        for (const part of parts) {
          if (part.isText && child.marks.length) {
            content.push(schema.text(part.text!, child.marks));
          } else {
            content.push(part);
          }
        }
      } else {
        content.push(mapNode(child, schema));
      }
    });
    return node.type.create(node.attrs, content, node.marks);
  }
  if (!node.content.size) {
    return node;
  }
  const content: Node[] = [];
  node.forEach((child) => content.push(mapNode(child, schema)));
  return node.type.create(node.attrs, content, node.marks);
}

const TABLE_SEPARATOR_RE = /\|(?:\s*:?-+:?\s*\|)+/;

function formatTableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/** Split a pipe segment into rows using separator column count. */
function rowsFromSegment(segment: string, colCount: number): string[] {
  const trimmed = segment.trim();
  if (!trimmed.includes('|') || colCount < 1) {
    return [];
  }
  const parts = trimmed.split('|').map((p) => p.trim());
  if (parts[0] === '') {
    parts.shift();
  }
  if (parts.length && parts[parts.length - 1] === '') {
    parts.pop();
  }
  const rows: string[] = [];
  let current: string[] = [];
  for (const part of parts) {
    if (part === '' && current.length === 0) {
      continue;
    }
    current.push(part);
    if (current.length === colCount) {
      rows.push(formatTableRow(current));
      current = [];
    }
  }
  if (current.length) {
    rows.push(formatTableRow(current));
  }
  return rows;
}

/** LLM often emits GFM tables as one long line; expand into real rows. */
function expandCollapsedTableLine(line: string): string {
  if (!line.includes('|') || !line.includes('-')) {
    return line;
  }
  const sepMatch = TABLE_SEPARATOR_RE.exec(line);
  if (!sepMatch) {
    return line;
  }
  const sep = sepMatch[0].trim();
  const colCount = (sep.match(/\|/g) || []).length - 1;
  if (colCount < 1) {
    return line;
  }
  const header = rowsFromSegment(line.slice(0, sepMatch.index), colCount);
  const body = rowsFromSegment(line.slice(sepMatch.index + sepMatch[0].length), colCount);
  if (!header.length || !body.length) {
    return line;
  }
  return [...header, sep, ...body].join('\n');
}

function normalizeOneLineTables(text: string): string {
  return text.split('\n').map(expandCollapsedTableLine).join('\n');
}

export const markdownParser = {
  schema: mySchema,
  parse(text: string): Node {
    const doc = rawParser.parse(normalizeOneLineTables(text || ''));
    return mapNode(doc, mySchema);
  },
};

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function tableCellText(cell: Node): string {
  return escapeTableCell(cell.textContent);
}

export const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    table(state, node) {
      const rows: string[][] = [];
      node.forEach((row) => {
        const cells: string[] = [];
        row.forEach((cell) => cells.push(tableCellText(cell)));
        rows.push(cells);
      });
      if (!rows.length) {
        return;
      }
      const colCount = Math.max(...rows.map((r) => r.length));
      const padded = rows.map((row) => {
        const copy = row.slice();
        while (copy.length < colCount) {
          copy.push('');
        }
        return copy;
      });
      const widths = Array.from({ length: colCount }, (_, i) =>
        Math.max(3, ...padded.map((r) => r[i].length)),
      );
      const line = (cells: string[]) =>
        `| ${cells
          .map((c, i) => c + ' '.repeat(Math.max(0, widths[i] - c.length)))
          .join(' | ')} |`;
      state.write(line(padded[0]));
      state.ensureNewLine();
      state.write(`| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`);
      state.ensureNewLine();
      for (let i = 1; i < padded.length; i++) {
        state.write(line(padded[i]));
        state.ensureNewLine();
      }
      state.closeBlock(node);
    },
    table_row() {
      /* serialized via table */
    },
    table_cell() {
      /* serialized via table */
    },
    table_header() {
      /* serialized via table */
    },
    mention_user(state, node) {
      state.write(`@${node.attrs['username']}`);
    },
    mention_issue(state, node) {
      state.write(`#${node.attrs['key']}`);
    },
  },
  defaultMarkdownSerializer.marks,
);
