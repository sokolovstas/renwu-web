import { markdownParser, mySchema } from '@renwu/components';
import { Node } from 'prosemirror-model';

// Same schema as the task description editor: headings, lists, code,
// tables, links, and marks. Collab steps must be decoded against this
// exact instance — a structurally identical Schema object is not
// interchangeable.
export const docSchema = mySchema;

const MARKDOWN_HINT =
  /(^|\n)(#{1,6}[ \t]|```|~~~|>[ \t]|[-*+][ \t]|\d+\.[ \t])|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|\|.+\|/;

/**
 * Opens a stored ProseMirror doc. Specs written by the AI are markdown
 * source stuffed into plain paragraphs; those are parsed into real
 * blocks so the editor shows and edits the rendered document.
 * A doc that already has structure (headings, lists, marks) is kept.
 */
export function documentFromJSON(json: unknown): Node {
  if (!json || typeof json !== 'object') {
    return emptyDoc();
  }
  try {
    return presentMarkdown(docSchema.nodeFromJSON(json));
  } catch {
    return emptyDoc();
  }
}

export function presentMarkdown(doc: Node): Node {
  if (!isMarkdownSource(doc)) {
    return doc;
  }
  const source = paragraphSource(doc);
  if (!source || !MARKDOWN_HINT.test(source)) {
    return doc;
  }
  try {
    const parsed = markdownParser.parse(source);
    if (!parsed.childCount) {
      return doc;
    }
    return parsed;
  } catch {
    return doc;
  }
}

function emptyDoc(): Node {
  return docSchema.node('doc', null, [docSchema.node('paragraph')]);
}

/** True when every block is a paragraph of unmarked text — the shape
 * plainTextToProseMirrorDoc writes. */
function isMarkdownSource(doc: Node): boolean {
  if (!doc.childCount) {
    return false;
  }
  let plain = true;
  doc.forEach((node) => {
    if (node.type.name !== 'paragraph') {
      plain = false;
      return;
    }
    node.descendants((child) => {
      if (child.isText) {
        if (child.marks.length) {
          plain = false;
        }
        return false;
      }
      if (child.isLeaf) {
        plain = false;
      }
      return true;
    });
  });
  return plain;
}

function paragraphSource(doc: Node): string {
  const parts: string[] = [];
  doc.forEach((node) => {
    parts.push(node.textContent);
  });
  return parts.join('\n\n');
}
