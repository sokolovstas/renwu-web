import { TimelineService } from './timeline.service';
import { Issue } from '../issue/issue.model';

function issue(id: string, links?: Issue['links']): Issue {
  return { id, key: id, links } as Issue;
}

describe('TimelineService.parseLinks', () => {
  const service = new TimelineService();

  it('dedupes the same prev/next edge when an issue appears twice in the tree', () => {
    const a = issue('a', {
      parent: [],
      related: [],
      prev_issue: [],
      next_issue: [{ id: 'b', key: 'b', title: 'B', have_childs: false } as never],
    });
    const b = issue('b');
    const map = { a, b };

    const links = service.parseLinks(
      [
        { ...a, childs: [] },
        { ...a, childs: [] },
      ],
      map,
    );

    const keys = links.map((l) => `${l.issue.id}-${l.link.id}-${l.type}`);
    expect(keys).toEqual(['a-b-before']);
  });
});
