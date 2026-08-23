import { Issue } from '@renwu/core';
import { BoardSettings, GroupedIssues } from './board.model';

function findField(id: string) {
  const field = BoardSettings.groupFields.find((f) => f.id === id);
  if (!field) {
    throw new Error(`No group field with id "${id}" found`);
  }
  return field;
}

function groupBy(
  fieldId: string,
  issues: Issue[],
): Record<string, GroupedIssues> {
  const field = findField(fieldId);
  return issues.reduce(field.group, {} as Record<string, GroupedIssues>);
}

describe('BoardSettings.groupFields', () => {
  describe('status', () => {
    it('buckets issues by status id, counting items per bucket', () => {
      const issues: Issue[] = [
        { id: 'i1', status: { id: 's1', label: 'Open' } as any },
        { id: 'i2', status: { id: 's1', label: 'Open' } as any },
        { id: 'i3', status: { id: 's2', label: 'Done' } as any },
      ];

      const groups = groupBy('status', issues);

      expect(Object.keys(groups).sort()).toEqual(['s1', 's2']);
      expect(groups['s1'].label).toBe('Open');
      expect(groups['s1'].reduce.count).toBe(2);
      expect(groups['s1'].items.map((i) => i.id)).toEqual(['i1', 'i2']);
      expect(groups['s2'].label).toBe('Done');
      expect(groups['s2'].reduce.count).toBe(1);
    });

    it('buckets an issue with no status under a generic "---" placeholder bucket', () => {
      // newItem() falls back to a plain '---' label whenever the grouped
      // value itself is `undefined` (as opposed to `null`), so the field's
      // own "Unset" labelFn is never actually reached for this field.
      const issues: Issue[] = [{ id: 'i1' }];
      const groups = groupBy('status', issues);

      const bucket = groups['null'];
      expect(bucket).toBeDefined();
      expect(bucket.label).toBe('---');
      expect(bucket.reduce.count).toBe(1);
    });

    it('does not count an issue missing an id (defensive against malformed data)', () => {
      const issues: Issue[] = [{ status: { id: 's1', label: 'Open' } as any }];
      const groups = groupBy('status', issues);

      expect(groups['s1'].reduce.count).toBe(0);
      expect(groups['s1'].items).toEqual([]);
    });
  });

  describe('milestone', () => {
    it('fans an issue out into every milestone (and parent milestone) it belongs to', () => {
      const issues: Issue[] = [
        {
          id: 'i1',
          milestones: [{ id: 'm1', title: 'Sprint 1' } as any],
          parent_milestones: [{ id: 'm2', title: 'Epic A' } as any],
        },
      ];

      const groups = groupBy('milestone', issues);

      expect(Object.keys(groups).sort()).toEqual(['m1', 'm2']);
      expect(groups['m1'].label).toBe('Sprint 1');
      expect(groups['m2'].label).toBe('Epic A');
      expect(groups['m1'].reduce.count).toBe(1);
      expect(groups['m2'].reduce.count).toBe(1);
    });

    it('groups issues with no milestones under "Unplanned" (valueF returns null, not undefined)', () => {
      const issues: Issue[] = [{ id: 'i1', milestones: [], parent_milestones: [] }];
      const groups = groupBy('milestone', issues);

      expect(groups['null'].label).toBe('Unplanned');
      expect(groups['null'].reduce.count).toBe(1);
    });
  });

  describe('assignee', () => {
    it('buckets by assignes_calc id, labelling by full_name or username', () => {
      const issues: Issue[] = [
        { id: 'i1', assignes_calc: [{ id: 'u1', full_name: 'Ada Lovelace' } as any] },
        { id: 'i2', assignes_calc: [{ id: 'u2', username: 'ghopper' } as any] },
      ];

      const groups = groupBy('assignee', issues);

      expect(groups['u1'].label).toBe('Ada Lovelace');
      expect(groups['u2'].label).toBe('ghopper');
    });
  });

  describe('label', () => {
    it('buckets an issue into every label it has', () => {
      const issues: Issue[] = [
        { id: 'i1', labels: ['bug', 'urgent'] },
        { id: 'i2', labels: ['bug'] },
      ];

      const groups = groupBy('label', issues);

      expect(Object.keys(groups).sort()).toEqual(['bug', 'urgent']);
      expect(groups['bug'].reduce.count).toBe(2);
      expect(groups['urgent'].reduce.count).toBe(1);
    });
  });

  describe('label-group / label-value (smart labels)', () => {
    it('splits "group:value" labels into a label-group bucket', () => {
      const issues: Issue[] = [
        { id: 'i1', labels: ['team:frontend', 'plain-label'], milestones: [], parent_milestones: [] },
        { id: 'i2', labels: ['team:backend'], milestones: [], parent_milestones: [] },
      ];

      const groups = groupBy('label-group', issues);

      expect(Object.keys(groups).sort()).toEqual(['team']);
      expect(groups['team'].reduce.count).toBe(2);
    });

    it('ignores labels without a colon separator', () => {
      const issues: Issue[] = [
        { id: 'i1', labels: ['no-colon-here'], milestones: [], parent_milestones: [] },
      ];

      const groups = groupBy('label-group', issues);

      expect(Object.keys(groups)).toEqual([]);
    });

    it('label-value groups the label-group items by the value half of the label', () => {
      // smartLabelGroup(1) ("label-value") reads a `__smartLabels` cache
      // that is only populated as a side effect of first running
      // smartLabelGroup(0) ("label-group") over the same issue objects -
      // this mirrors how the real board groups hierarchically (label-group
      // as the outer level, label-value as the inner level).
      const issues: Issue[] = [
        { id: 'i1', labels: ['team:frontend'], milestones: [], parent_milestones: [] },
        { id: 'i2', labels: ['team:backend'], milestones: [], parent_milestones: [] },
      ];

      const labelGroupField = findField('label-group');
      const labelGroups = issues.reduce(
        labelGroupField.group,
        {} as Record<string, GroupedIssues>,
      );
      const teamItems = labelGroups['team'].items;

      const labelValueField = findField('label-value');
      const valueGroups = teamItems.reduce(
        labelValueField.group,
        {} as Record<string, GroupedIssues>,
      );

      expect(Object.keys(valueGroups).sort()).toEqual(['backend', 'frontend']);
    });
  });

  describe('key', () => {
    it('groups each issue into its own bucket keyed by issue key', () => {
      const issues: Issue[] = [
        { id: 'i1', key: 'BRD-1', title: 'First' },
        { id: 'i2', key: 'BRD-2', title: 'Second' },
      ];

      const groups = groupBy('key', issues);

      expect(Object.keys(groups).sort()).toEqual(['BRD-1', 'BRD-2']);
      expect(groups['BRD-1'].label).toBe('BRD-1 - First');
    });
  });

  // NOTE: the date-based group fields ('sdate-d/-w/-m/-q' and
  // 'log-date-d/-w/-m/-q') build their bucket keys via date-fns `format()`
  // using legacy v1-style tokens (e.g. 'DDMMYYYY'). The installed date-fns
  // version (v3) throws on those tokens, and `group()`'s internal try/catch
  // silently swallows the error per-issue, so every issue is currently
  // dropped from these groupings. Documented here rather than skipped, so
  // this test fails loudly (as a signal to update it) if the tokens are
  // ever fixed to the modern date-fns format.
  describe('start date by day (dateGroup helper)', () => {
    it('currently drops every issue because date-fns rejects the legacy format tokens', () => {
      const issues: Issue[] = [
        { id: 'i1', date_start_calc: '2024-03-05T10:00:00.000Z' },
        { id: 'i2', date_start_calc: '2024-03-06T10:00:00.000Z' },
      ];

      const groups = groupBy('sdate-d', issues);

      expect(Object.keys(groups)).toHaveLength(0);
    });
  });

  describe('timelog date by day (logdateGroup helper)', () => {
    it('currently drops every issue because date-fns rejects the legacy format tokens', () => {
      const issues: Issue[] = [
        {
          id: 'i1',
          key: 'BRD-1',
          title: 'Logged issue',
          time_logs: [{ value: 100, date_created: '2024-03-05T09:00:00.000Z' } as any],
        },
      ];

      const groups = groupBy('log-date-d', issues);

      expect(Object.keys(groups)).toHaveLength(0);
    });
  });

  it('has no duplicate group field ids', () => {
    const ids = BoardSettings.groupFields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
