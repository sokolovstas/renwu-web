import { BoardGroupsConfigServer } from '@renwu/core';
import {
  BoardGroup,
  BoardGroupConfig,
  BoardGroupsConfig,
  BoardSettings,
} from './board.model';

describe('BoardGroupsConfig', () => {
  it('defaults a new board to the first issue view/card type and a single group', () => {
    const config = new BoardGroupsConfig('My board');

    expect(config.id).toBeUndefined();
    expect(config.title).toBe('My board');
    expect(config.groups).toHaveLength(1);
    expect(config.groups[0].field).toBe(BoardSettings.groupFields[0]);
    expect(config.groups[0].view).toBe(BoardSettings.groupViews[0]);
    expect(config.view).toBe(BoardSettings.issueViews[0]);
    expect(config.type).toBe(BoardSettings.cardType[0]);
  });

  it('falls back to the "New board" title when none is given', () => {
    const config = new BoardGroupsConfig();
    expect(config.title).toBe('New board');
  });

  describe('fromServer', () => {
    const serverConfig: BoardGroupsConfigServer = {
      id: 'board-1',
      title: 'Sprint board',
      groups: [
        {
          field: 'priority',
          view: 'rows',
          fixed: ['p1'],
          group_only: true,
          show_empty: true,
        },
      ],
      view: 'cards-h',
      type: 'table',
      shared: true,
      author_id: 'user-1',
      show_logs: true,
      hide_parents: true,
      collapse_empty: true,
    };

    it('maps every server field onto the client model', () => {
      const config = BoardGroupsConfig.fromServer(serverConfig);

      expect(config.id).toBe('board-1');
      expect(config.title).toBe('Sprint board');
      expect(config.shared).toBe(true);
      expect(config.showLogs).toBe(true);
      expect(config.hideParents).toBe(true);
      expect(config.collapseEmpty).toBe(true);
      expect(config.authorId).toBe('user-1');
      expect(config.view).toBe(BoardSettings.issueViews.find((v) => v.id === 'cards-h'));
      expect(config.type).toBe(BoardSettings.cardType.find((t) => t.id === 'table'));

      expect(config.groups).toHaveLength(1);
      const group = config.groups[0];
      expect(group.field).toBe(
        BoardSettings.groupFields.find((f) => f.id === 'priority'),
      );
      expect(group.view).toBe(BoardSettings.groupViews.find((v) => v.id === 'rows'));
      expect(group.fixed).toEqual(['p1']);
      expect(group.groupOnly).toBe(true);
      expect(group.showEmpty).toBe(true);
    });

    it('falls back to the first group field/view when the server sends an unknown id', () => {
      const config = BoardGroupsConfig.fromServer({
        ...serverConfig,
        groups: [
          {
            field: 'not-a-real-field',
            view: 'not-a-real-view',
            fixed: [],
            group_only: false,
            show_empty: false,
          },
        ],
        view: 'not-a-real-issue-view',
        type: 'not-a-real-card-type',
      });

      expect(config.groups[0].field).toBe(BoardSettings.groupFields[0]);
      expect(config.groups[0].view).toBe(BoardSettings.groupViews[0]);
      expect(config.view).toBe(BoardSettings.issueViews[0]);
      expect(config.type).toBe(BoardSettings.cardType[0]);
    });

    it('maps multiple groups in order', () => {
      const config = BoardGroupsConfig.fromServer({
        ...serverConfig,
        groups: [
          { field: 'status', view: 'columns', fixed: [], group_only: false, show_empty: false },
          { field: 'assignee', view: 'rows', fixed: [], group_only: false, show_empty: false },
        ],
      });

      expect(config.groups.map((g) => g.field.id)).toEqual(['status', 'assignee']);
    });
  });

  describe('toServer', () => {
    it('round-trips through fromServer/toServer', () => {
      const serverConfig: BoardGroupsConfigServer = {
        id: 'board-2',
        title: 'Roadmap',
        groups: [
          {
            field: 'milestone',
            view: 'columns',
            fixed: ['m1', 'm2'],
            group_only: false,
            show_empty: true,
            status_columns: [],
          },
        ],
        view: 'cards-v',
        type: 'card',
        shared: false,
        author_id: 'user-2',
        show_logs: false,
        hide_parents: false,
        collapse_empty: false,
        card_density: 'normal',
        color_mode: 'status',
      };

      const roundTripped = BoardGroupsConfig.fromServer(serverConfig).toServer();

      expect(roundTripped).toEqual(serverConfig);
    });
  });

  describe('clone', () => {
    it('produces a deep-equal but independent copy', () => {
      const original = BoardGroupsConfig.fromServer({
        id: 'board-3',
        title: 'Clone me',
        groups: [
          { field: 'status', view: 'columns', fixed: [], group_only: false, show_empty: false },
        ],
        view: 'cards-v',
        type: 'card',
        shared: false,
        author_id: 'user-3',
        show_logs: false,
        hide_parents: false,
        collapse_empty: false,
      });

      const clone = original.clone();

      expect(clone).not.toBe(original);
      expect(clone.groups).not.toBe(original.groups);
      expect(clone.toServer()).toEqual(original.toServer());

      clone.title = 'Changed';
      expect(original.title).toBe('Clone me');
    });
  });
});

describe('BoardGroupConfig', () => {
  it('defaults to the first group field and group view', () => {
    const config = new BoardGroupConfig();
    expect(config.field).toBe(BoardSettings.groupFields[0]);
    expect(config.view).toBe(BoardSettings.groupViews[0]);
  });
});

describe('BoardGroup', () => {
  it('initializes empty items/groups collections for a given config', () => {
    const groupConfig = new BoardGroupConfig();
    const group = new BoardGroup(groupConfig);

    expect(group.uid).toBe('0');
    expect(group.config).toBe(groupConfig);
    expect(group.items).toEqual([]);
    expect(group.groups).toEqual([]);
    expect(group.groupsMap.size).toBe(0);
    expect(group.label).toBe('');
    expect(group.issue).toBeUndefined();
    expect(group.parent).toBeUndefined();
  });
});
