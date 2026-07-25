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

const nodesWithMentions = markdownSchema.spec.nodes.append({
  mention_user: mentionUserSpec,
  mention_issue: mentionIssueSpec,
});

const headingSpec = nodesWithMentions.get('heading');

/** Markdown schema with @user / #ISSUE mention atoms. */
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

const rawParser = new MarkdownParser(
  mySchema,
  defaultMarkdownParser.tokenizer,
  defaultMarkdownParser.tokens,
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
        // Preserve marks on plain text fragments only.
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

export const markdownParser = {
  schema: mySchema,
  parse(text: string): Node {
    const doc = rawParser.parse(text || '');
    return mapNode(doc, mySchema);
  },
};

export const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    mention_user(state, node) {
      state.write(`@${node.attrs['username']}`);
    },
    mention_issue(state, node) {
      state.write(`#${node.attrs['key']}`);
    },
  },
  defaultMarkdownSerializer.marks,
);
