import { TestBed } from '@angular/core/testing';
import { Issue } from '../issue/issue.model';
import { RwUserService } from '../user/user.service';
import { IssueGroupBarService } from './group-bar.service';

const avatarColors: Record<string, string> = {
  u1: '#4a90d9',
  u2: '#e3635a',
};

describe('IssueGroupBarService', () => {
  let service: IssueGroupBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IssueGroupBarService,
        {
          provide: RwUserService,
          useValue: {
            getInitialsColor: (user?: { id?: string }) =>
              (user?.id && avatarColors[user.id]) || '',
          },
        },
      ],
    });
    service = TestBed.inject(IssueGroupBarService);
  });

  it('keeps the same progress shares as estimated time', () => {
    const segments = service.buildSegments(
      [
        issue({
          status: { id: 'a', label: 'A', color: '#111' },
          estimated_time: 1,
        }),
        issue({
          status: { id: 'b', label: 'B', color: '#222' },
          estimated_time: 3,
        }),
      ],
      ['status'],
    );

    expect(segments.map((item) => item.value.label)).toEqual(['A', 'B']);
    expect(segments.map((item) => item.progress)).toEqual([25, 75]);
    expect(segments.map((item) => item.value.color)).toEqual(['#111', '#222']);
  });

  it('groups assignees with avatar colors', () => {
    const segments = service.buildSegments(
      [
        issue({
          assignes: [{ id: 'u1', username: 'alice', full_name: 'Alice A' }],
          estimated_time: 2,
        }),
        issue({
          assignes: [{ id: 'u1', username: 'alice', full_name: 'Alice A' }],
          estimated_time: 2,
        }),
        issue({
          assignes: [{ id: 'u2', username: 'bob', full_name: 'Bob B' }],
          estimated_time: 4,
        }),
      ],
      ['assignes'],
    );

    expect(segments.map((item) => item.value.label)).toEqual(['Alice A', 'Bob B']);
    expect(segments.map((item) => item.progress)).toEqual([50, 50]);
    expect(segments[0].value.color).toBe('#4a90d9');
    expect(segments[1].value.color).toBe('#e3635a');
  });

  it('falls back to counts when there is no estimated time', () => {
    const segments = service.buildSegments(
      [
        issue({ skill: 'backend', estimated_time: 0 }),
        issue({ skill: 'backend', estimated_time: 0 }),
        issue({ skill: 'frontend', estimated_time: 0 }),
      ],
      ['skill'],
    );

    expect(segments.map((item) => item.progress)).toEqual([
      expect.closeTo(66.666, 2),
      expect.closeTo(33.333, 2),
    ]);
  });
});

function issue(partial: Issue): Issue {
  return { estimated_time: 0, ...partial };
}
