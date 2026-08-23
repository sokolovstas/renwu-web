jest.mock('@renwu/core', () => ({
  RwContainerService: class RwContainerService {},
  // UserStatic is used as a plain value helper (not injected), so re-implement
  // its small, pure sort-name logic here to keep this file independent of the
  // real @renwu/core module (which cannot be safely imported under Jest in
  // this workspace, see other board specs for details).
  UserStatic: {
    getSortValue: (user) => {
      if (user && user.full_name && user.full_name.trim()) {
        return user.full_name;
      }
      if (user && user.username && user.username.trim()) {
        return user.username;
      }
      return '';
    },
  },
}));

import { Issue, ListOptionsFilters, RwContainerService } from '@renwu/core';
import { TestBed } from '@angular/core/testing';
import { SortListPipe } from './sort-list.pipe';

describe('SortListPipe', () => {
  let containerService: {
    getDictionaryMap: jest.Mock;
  };
  let pipe: SortListPipe<Issue>;

  beforeEach(() => {
    containerService = {
      getDictionaryMap: jest.fn().mockReturnValue(
        new Map([
          ['p1', { id: 'p1', sort: 2 }],
          ['p2', { id: 'p2', sort: 1 }],
        ]),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        SortListPipe,
        { provide: RwContainerService, useValue: containerService },
      ],
    });
    pipe = TestBed.inject(SortListPipe);
  });

  describe('direction/null-position helpers', () => {
    it('getDirectionSort flips the sign only when direction is "down"', () => {
      pipe.direction = 'up';
      expect(pipe.getDirectionSort(5)).toBe(5);
      pipe.direction = 'down';
      expect(pipe.getDirectionSort(5)).toBe(-5);
    });

    it('getNullPosition flips the sign only when nullPosition is "up"', () => {
      pipe.nullPosition = 'down';
      expect(pipe.getNullPosition(3)).toBe(3);
      pipe.nullPosition = 'up';
      expect(pipe.getNullPosition(3)).toBe(-3);
    });
  });

  describe('zeroPadding / zeroPaddingKey', () => {
    it.each([
      ['250', 5, '00250'],
      ['1250', 5, '01250'],
      ['1', 3, '001'],
    ])('zeroPadding(%s, %s) -> %s', (input, count, expected) => {
      expect(pipe.zeroPadding(input, count)).toBe(expected);
    });

    it.each([
      ['PMP-250', '0000000250'],
      ['PMP-1', '0000000001'],
      [null, null],
      ['nodashhere', null],
    ])('zeroPaddingKey(%s) -> %s', (input, expected) => {
      expect(pipe.zeroPaddingKey(input)).toBe(expected);
    });
  });

  describe('compareString', () => {
    it.each([
      [undefined, undefined, 0],
      ['a', undefined, -1],
      [undefined, 'a', 1],
      ['a', 'b', -1],
      ['b', 'a', 1],
      ['a', 'a', 0],
    ])('compareString(%p, %p) -> %p', (a, b, expected) => {
      expect(pipe.compareString(a as string, b as string)).toBe(expected);
    });

    it('respects the configured sort direction', () => {
      pipe.direction = 'down';
      expect(pipe.compareString('a', 'b')).toBe(1);
    });
  });

  describe('compareNumber', () => {
    it.each([
      [undefined, undefined, 0],
      [1, undefined, -1],
      [undefined, 1, 1],
      [1, 2, -1],
      [2, 1, 1],
      [1, 1, 0],
      [null, 5, 1],
      [5, null, -1],
    ])('compareNumber(%p, %p) -> %p', (a, b, expected) => {
      expect(pipe.compareNumber(a as number, b as number)).toBe(expected);
    });
  });

  describe('transform', () => {
    const issueA: Issue = {
      id: '1',
      key: 'PMP-1240',
      title: 'Issue 1',
      completion: 0,
      date_created: '2018-02-22T11:53:31.367Z',
      priority: { id: 'p1' } as any,
      assignes: [{ username: 'user1', full_name: 'User 1' } as any],
    };
    const issueB: Issue = {
      id: '2',
      key: 'PMP-1440',
      title: 'Issue 2',
      completion: 50,
      date_created: '2018-02-23T11:53:31.367Z',
      priority: { id: 'p2' } as any,
      assignes_calc: [{ username: 'user2', full_name: 'User 2' } as any],
    };

    function options(field: string, direction: 'up' | 'down'): ListOptionsFilters {
      return { sort: { field: field as never, direction }, textFilter: {} };
    }

    it('returns the input unchanged (aside from filtering) when array is falsy', () => {
      expect(pipe.transform(undefined as unknown as Issue[], options('key', 'up'))).toEqual([]);
    });

    it('removes null/undefined items from the array', () => {
      const result = pipe.transform(
        [issueA, null as unknown as Issue, issueB],
        options('key', 'up'),
      );
      expect(result).toHaveLength(2);
      expect(result).not.toContain(null);
    });

    it('sorts by key, honoring direction', () => {
      const up = pipe.transform([issueB, issueA], options('key', 'up'));
      expect(up.map((i) => i.key)).toEqual(['PMP-1240', 'PMP-1440']);

      const down = pipe.transform([issueB, issueA], options('key', 'down'));
      expect(down.map((i) => i.key)).toEqual(['PMP-1440', 'PMP-1240']);
    });

    it('sorts by title (a generic string field)', () => {
      const result = pipe.transform([issueB, issueA], options('title', 'up'));
      expect(result.map((i) => i.title)).toEqual(['Issue 1', 'Issue 2']);
    });

    it('sorts by completion (a generic number field)', () => {
      const result = pipe.transform([issueB, issueA], options('completion', 'up'));
      expect(result.map((i) => i.completion)).toEqual([0, 50]);
    });

    it('sorts by a dictionary field using the container service sort value', () => {
      // p1 has sort=2, p2 has sort=1, so issueB (p2) sorts first ascending
      const result = pipe.transform([issueA, issueB], options('priority', 'up'));
      expect(result.map((i) => i.id)).toEqual(['2', '1']);
    });

    it('sorts by assignee, falling back from assignes to assignes_calc', () => {
      const result = pipe.transform([issueB, issueA], options('assignes', 'up'));
      expect(result.map((i) => i.id)).toEqual(['1', '2']);
    });

    it('filters by title/key text filter, matching case-insensitively', () => {
      const opts = options('key', 'up');
      opts.textFilter = { title: 'issue 2' };
      const result = pipe.transform([issueA, issueB], opts);
      expect(result.map((i) => i.id)).toEqual(['2']);
    });

    it('reads the sort target from a nested field when issueField is given', () => {
      const wrapped = [{ issue: issueB }, { issue: issueA }] as unknown as Issue[];
      const result = pipe.transform(
        wrapped,
        options('key', 'up'),
        'down',
        'issue',
      );
      expect(result.map((r: any) => r.issue.key)).toEqual([
        'PMP-1240',
        'PMP-1440',
      ]);
    });
  });
});
