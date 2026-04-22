import { collectLinkedIssueKeys, isIssueKeyInAnyLinkBucket } from './issue-links.util';

describe('issue-links.util', () => {
  describe('isIssueKeyInAnyLinkBucket', () => {
    it('returns true when key appears in any bucket', () => {
      expect(
        isIssueKeyInAnyLinkBucket('FOO-1', {
          parent: [{ key: 'FOO-1' }],
          prev_issue: [],
          next_issue: [],
          related: [],
        }),
      ).toBe(true);
      expect(
        isIssueKeyInAnyLinkBucket('FOO-1', {
          parent: [],
          prev_issue: [{ key: 'FOO-1' }],
          next_issue: [],
          related: [],
        }),
      ).toBe(true);
      expect(
        isIssueKeyInAnyLinkBucket('FOO-1', {
          parent: [],
          prev_issue: [],
          next_issue: [{ key: 'FOO-1' }],
          related: [],
        }),
      ).toBe(true);
      expect(
        isIssueKeyInAnyLinkBucket('FOO-1', {
          parent: [],
          prev_issue: [],
          next_issue: [],
          related: [{ key: 'FOO-1' }],
        }),
      ).toBe(true);
    });

    it('returns false when key is absent', () => {
      expect(
        isIssueKeyInAnyLinkBucket('FOO-2', {
          parent: [{ key: 'FOO-1' }],
          prev_issue: [],
          next_issue: [],
          related: [],
        }),
      ).toBe(false);
    });
  });

  describe('collectLinkedIssueKeys', () => {
    it('collects unique keys from all buckets', () => {
      expect(
        collectLinkedIssueKeys({
          parent: [{ key: 'A' }],
          prev_issue: [{ key: 'B' }],
          next_issue: [{ key: 'A' }],
          related: [{ key: 'C' }],
        }).sort(),
      ).toEqual(['A', 'B', 'C']);
    });
  });
});
