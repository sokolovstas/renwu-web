import { mySchema } from '@renwu/components';
import { Mentions } from '@renwu/mentions';
import { EditorState, TextSelection } from 'prosemirror-state';
import { of } from 'rxjs';
import { resolveMentionRange } from './mention-autocomplete.plugin';

function stateAtEnd(text: string): EditorState {
  const paragraph = mySchema.node(
    'paragraph',
    null,
    text ? [mySchema.text(text)] : [],
  );
  const doc = mySchema.node('doc', null, [paragraph]);
  const pos = 1 + text.length;
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, pos),
  });
}

const slashProvider: Mentions<unknown> = {
  triggerChars: ['/'],
  itemComponent: class {} as never,
  getItems: () => of([]),
};

const userProvider: Mentions<unknown> = {
  triggerChars: ['@'],
  itemComponent: class {} as never,
  getItems: () => of([]),
};

describe('resolveMentionRange slash commands', () => {
  it('opens on lone /', () => {
    const range = resolveMentionRange(stateAtEnd('/'), [
      userProvider,
      slashProvider,
    ]);
    expect(range).toBeTruthy();
    expect(range?.trigger).toBe('/');
    expect(range?.query).toBe('');
  });

  it('opens on /refresh query', () => {
    const range = resolveMentionRange(stateAtEnd('/ref'), [
      userProvider,
      slashProvider,
    ]);
    expect(range?.trigger).toBe('/');
    expect(range?.query).toBe('ref');
  });

  it('opens after space', () => {
    const range = resolveMentionRange(stateAtEnd('hi /r'), [slashProvider]);
    expect(range?.trigger).toBe('/');
    expect(range?.query).toBe('r');
  });

  it('ignores mid-word slash', () => {
    const range = resolveMentionRange(stateAtEnd('http://x'), [slashProvider]);
    expect(range).toBeNull();
  });
});
