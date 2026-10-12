import { TestBed } from '@angular/core/testing';

import { IssueEvent } from './websocket.model';
import { RwWebsocketService } from './websocket.service';

describe('RwWebsocketService', () => {
  let service: RwWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwWebsocketService],
    });
    service = TestBed.inject(RwWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('onIssueEvent', () => {
    function listen(ids: string[]): { received: IssueEvent[]; errors: unknown[] } {
      const received: IssueEvent[] = [];
      const errors: unknown[] = [];
      service.onIssueEvent(ids).subscribe({
        next: (e) => received.push(e),
        error: (err) => errors.push(err),
      });
      return { received, errors };
    }

    const base = {
      type: 'issue_update' as const,
      container: 'c1',
      user: 'u1',
    };

    it('does not error when issues is null and still matches container', () => {
      const { received, errors } = listen(['c1']);
      service.issue.next({ ...base, issues: null } as unknown as IssueEvent);
      expect(errors).toEqual([]);
      expect(received).toHaveLength(1);
    });

    it('does not error when issues is omitted', () => {
      const { received, errors } = listen(['i1']);
      service.issue.next({ ...base } as unknown as IssueEvent);
      expect(errors).toEqual([]);
      expect(received).toEqual([]);
    });

    it('matches by issue id when issues is an array', () => {
      const { received, errors } = listen(['i1']);
      service.issue.next({ ...base, issues: ['i1'] });
      expect(errors).toEqual([]);
      expect(received).toHaveLength(1);
    });
  });
});
