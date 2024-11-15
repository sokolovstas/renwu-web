/* eslint-disable @typescript-eslint/no-explicit-any */
// import { captureException } from '@sentry/browser';
import {
  BoardGroupsConfigServer,
  Issue,
  SortFields,
  TimeLog,
} from '@renwu/core';
import { JSONUtils, TimeUnit, startOf } from '@renwu/utils';
import { format } from 'date-fns';
import durationFns from 'duration-fns';

export type DictKeys =
  | 'statuses'
  | 'priorities'
  | 'types'
  | 'resolutions'
  | 'users'
  | 'milestones'
  | 'skills'
  | 'labels';
export interface GroupedIssues {
  uid: string;
  items: Issue[];
  ids: Set<string>;
  issue: Issue;
  label: string;
  sort: Issue;
  reduce: {
    count: number;
    timeLogged: number;
    timePlanned: number;
    timeRemaining: number;
  };
}

type idFunction = (i: Issue) => string[];
type valueFunction = (i: Issue) => any[];
type labelFunction = (field: any) => string;
type issueFunction = (field: any) => Issue;
type sortFunction = (field: any) => Issue;
type postFunction = (group: GroupedIssues) => GroupedIssues;
type transformFunction = (i: Issue, field: any) => Issue;
type groupReduceFunction = (
  acc: { [key: string]: GroupedIssues },
  issue: any,
) => { [key: string]: GroupedIssues };
type initFunction = (dict: Map<DictKeys, any[]>) => Issue[];

const newItem = (
  uid: string,
  item: any,
  labelF: labelFunction,
  transformF: transformFunction,
  issueF: issueFunction,
) => {
  const reduce = { count: 0, timeLogged: 0, timePlanned: 0, timeRemaining: 0 };
  if (item === undefined) {
    return {
      uid: uid,
      items: [],
      label: '---',
      issue: {},
      sort: {},
      reduce: reduce,
    } as GroupedIssues;
  }
  return {
    uid: uid,
    items: [],
    label: labelF(item),
    issue: issueF(item),
    sort: {},
    reduce: reduce,
  } as GroupedIssues;
};

const group = (
  idF: idFunction,
  valueF: valueFunction,
  labelF: labelFunction,
  transformF: transformFunction,
  issueF: issueFunction,
  sortF?: sortFunction,
  postF?: postFunction,
): groupReduceFunction => {
  const reduce: groupReduceFunction = (
    acc: { [key: string]: GroupedIssues },
    issue: Issue,
  ) => {
    try {
      const ids: string[] = idF(issue);
      const vals: any[] = valueF(issue);
      for (let i = 0; i < ids.length; i++) {
        const value: Issue = transformF(issue, vals[i]);
        const group = (acc[ids[i]] =
          acc[ids[i]] || newItem(ids[i], vals[i], labelF, transformF, issueF));
        group.ids = group.ids || new Set();
        group.sort = sortF ? sortF(value) : issueF(value);
        if (value.id) {
          group.items.push(value);
          group.ids.add(value.id);
          if (value.estimated_time) {
            group.reduce.timePlanned += durationFns.toSeconds({
              seconds: value.estimated_time,
            });
            group.reduce.timeRemaining +=
              ((100 - value.completion) *
                durationFns.toSeconds({ seconds: value.estimated_time })) /
              100;
          }
          group.reduce.count += 1;
          if (value.time_logs && Array.isArray(value.time_logs)) {
            for (const timeLog of value.time_logs) {
              group.reduce.timeLogged += durationFns.toSeconds({
                seconds: timeLog.value,
              });
            }
          }
        }
      }
      if (postF) {
        Object.values(acc).forEach((g) => (g = postF(g)));
      }
    } catch (e) {
      console.log(e);
      // captureException(e);
      return acc;
    }

    return acc;
  };
  return reduce;
};

const init = (issueF: issueFunction, dict: DictKeys): initFunction => {
  return (dicts) => {
    if (!dicts) return [];
    const initials: Issue[] = [];
    for (const item of dicts.get(dict)) {
      initials.push(issueF(item));
    }
    return initials;
  };
};

const dateGroup = (
  dateKey: keyof Issue,
  keyFormat: string,
  labelFormat: string,
  startOfUnit: TimeUnit,
): groupReduceFunction => {
  return group(
    (issue) => [format(new Date(issue[dateKey] as string), keyFormat)],
    (issue) => [issue[dateKey]],
    (field) => format(new Date(field), labelFormat),
    (issue) => issue,
    () => null,
    (issue) => {
      const i: Record<string, any> = {};
      i[dateKey] = startOf(new Date(issue[dateKey]), startOfUnit).toISOString();
      return i;
    },
  );
};

const logdateGroup = (
  dateKey: keyof TimeLog,
  keyFormat: string,
  labelFormat: string,
  startOfUnit: TimeUnit,
): groupReduceFunction => {
  return group(
    (issue) =>
      issue.time_logs.map((item) =>
        format(new Date(item[dateKey] as string), keyFormat),
      ),
    (issue) => issue.time_logs.map((item) => item),
    (field) => format(new Date(field[dateKey]), labelFormat),
    (issue, field) => {
      const i = JSONUtils.jsonClone(issue);
      i.time_logs = [field];
      return i;
    },
    () => {
      return null;
    },
    (issue) => {
      const i: any = {};

      i['__timelog-date-created'] = startOf(
        new Date(issue.time_logs[0][dateKey]),
        startOfUnit,
      ).toISOString();
      return i;
    },
    (group) => {
      const allLogs = group.items.reduce((acc, issue) => {
        const index = acc.findIndex((i) => i.id === issue.id);
        if (index === -1) {
          acc.push(issue);
        } else {
          acc[index].time_logs = [...acc[index].time_logs, ...issue.time_logs];
        }
        return acc;
      }, new Array<Issue>());
      group.items = allLogs;
      return group;
    },
  );
};

const smartLabelGroup = (index: number) => {
  return group(
    (issue) => {
      if (index === 0) {
        (issue as any).__smartLabels = [];
        const labelsGroup: Set<string> = new Set();
        issue.labels.forEach((label) => {
          if (label && label.indexOf(':') > -1) {
            (issue as any).__smartLabels.push(label);
            labelsGroup.add(label.split(':')[0]);
          }
        });
        issue.milestones.forEach((m) => {
          if (m.labels) {
            m.labels.forEach((label) => {
              if (label && label.indexOf(':') > -1) {
                const group = label.split(':')[0];
                if (!labelsGroup.has(group)) {
                  (issue as any).__smartLabels.push(label);
                }
              }
            });
          }
        });
        issue.parent_milestones.forEach((m) => {
          if (m.labels) {
            m.labels.forEach((label) => {
              if (label && label.indexOf(':') > -1) {
                const group = label.split(':')[0];
                if (!labelsGroup.has(group)) {
                  (issue as any).__smartLabels.push(label);
                }
              }
            });
          }
        });
      }
      return (issue as any).__smartLabels.reduce(
        (acc: string[], label: string) => {
          acc.push(label.split(':')[index]);
          return acc;
        },
        [],
      );
    },
    (issue) =>
      (issue as any).__smartLabels.reduce((acc: string[], label: string) => {
        acc.push(label);
        return acc;
      }, []),
    (field) => field.split(':')[index],
    (issue, field) => {
      const i = JSONUtils.jsonClone(issue);
      i.labels = issue.labels.filter((l) => l.indexOf(':') === -1);
      // Filter smartlabels by group of incoming field
      if (index === 0) {
        (i as any).__smartLabels = (issue as any).__smartLabels.filter(
          (l: string) => {
            return l.indexOf(field.split(':')[0]) === 0;
          },
        );
      }
      return i;
    },
    () => {
      return {};
    },
  );
};
export class BoardSettings {
  static groupFields: BoardGroupsField[] = [
    {
      label: 'Status',
      id: 'status',
      sort: 'status',
      dict: 'statuses',
      init: init((status) => ({ status: status }), 'statuses'),
      group: group(
        (issue) => [issue.status ? issue.status.id : null],
        (issue) => [issue.status],
        (field) => (field ? field.label : 'Unset'),
        (issue) => issue,
        (field) => (field ? { status: field } : { status: undefined }),
      ),
    },
    {
      label: 'Type',
      id: 'type',
      sort: 'type',
      dict: 'types',
      init: init((type) => ({ type: type }), 'types'),
      group: group(
        (issue) => [issue.type ? issue.type.id : null],
        (issue) => [issue.type],
        (field) => (field ? field.label : 'Unset'),
        (issue) => issue,
        (field) => (field ? { type: field } : { type: undefined }),
      ),
    },
    {
      label: 'Resolution',
      id: 'resolution',
      sort: 'resolution',
      dict: 'resolutions',
      init: init((resolution) => ({ resolution: resolution }), 'resolutions'),
      group: group(
        (issue) => [issue.resolution ? issue.resolution.id : null],
        (issue) => [issue.resolution ? issue.resolution : null],
        (field) => (field ? field.label : 'Unresolved'),
        (issue) => issue,
        (field) => (field ? { resolution: field } : { resolution: undefined }),
      ),
    },
    {
      label: 'Priority',
      id: 'priority',
      sort: 'priority',
      dict: 'priorities',
      init: init((priority) => ({ priority: priority }), 'priorities'),
      group: group(
        (issue) => [issue.priority ? issue.priority.id : null],
        (issue) => [issue.priority],
        (field) => (field ? field.label : 'Unset'),
        (issue) => issue,
        (field) => (field ? { priority: field } : { priority: undefined }),
      ),
    },
    {
      label: 'Milestone',
      id: 'milestone',
      sort: 'milestones.sort',
      dict: 'milestones',
      init: init((milestone) => ({ milestones: [milestone] }), 'milestones'),
      group: group(
        (issue) => {
          const parent = issue.parent_milestones || [];
          const ids = [...issue.milestones, ...parent].map((item) => item.id);
          return ids.length === 0 ? ['null'] : ids;
        },
        (issue) => {
          const parent = issue.parent_milestones || [];
          const items = [...issue.milestones, ...parent].map((item) => item);
          return items.length === 0 ? [null] : items;
        },
        (field) => (field ? field.title : 'Unplanned'),
        (issue) => issue,
        (field) => (field ? { milestones: [field] } : { milestones: [] }),
      ),
    },
    {
      label: 'Assignee',
      id: 'assignee',
      sort: 'assignes',
      dict: 'users',
      init: init((user) => ({ assignes_calc: [user] }), 'users'),
      group: group(
        (issue) => issue.assignes_calc.map((item) => item.id),
        (issue) => issue.assignes_calc.map((item) => item),
        (field) => field.full_name || field.username,
        (issue) => issue,
        (field) => (field ? { assignes_calc: [field] } : { assignes_calc: [] }),
      ),
    },
    {
      label: 'Reporter',
      id: 'reporter',
      sort: 'reporter',
      dict: 'users',
      init: init((user) => ({ reporter: user }), 'users'),
      group: group(
        (issue) => [issue.reporter ? issue.reporter.id : null],
        (issue) => [issue.reporter],
        (field) => field.full_name || field.username,
        (issue) => issue,
        () => {
          return null;
        },
      ),
    },
    {
      label: 'Skill',
      id: 'skill',
      sort: 'skill',
      dict: 'skills',
      init: init((skill) => ({ skill: skill }), 'skills'),
      group: group(
        (issue) => [issue.skill],
        (issue) => [issue.skill],
        (field) => field,
        (issue) => issue,
        (field) => (field ? { skill: field } : { skill: undefined }),
      ),
    },
    {
      label: 'Labels',
      id: 'label',
      dict: 'labels',
      init: init((label) => ({ labels: [label] }), 'labels'),
      group: group(
        (issue) => issue.labels,
        (issue) => issue.labels,
        (field) => field,
        (issue) => issue,
        (field) => (field ? { labels: [field] } : { labels: [] }),
      ),
    },
    {
      label: 'Label group',
      id: 'label-group',
      group: smartLabelGroup(0),
    },
    {
      label: 'Label value',
      id: 'label-value',
      group: smartLabelGroup(1),
    },
    {
      label: 'Container',
      id: 'container',
      group: group(
        (issue) => [issue.container ? issue.container.id : null],
        (issue) => [issue.container],
        (field) => field.title,
        (issue) => issue,
        () => {
          return null;
        },
      ),
    },
    {
      label: 'Key',
      id: 'key',
      sort: 'key',
      group: group(
        (issue) => [issue.key],
        (issue) => [issue],
        (field) => `${field.key} - ${field.title}`,
        (issue) => issue,
        () => {
          return null;
        },
      ),
    },
    {
      label: 'Start date by day',
      id: 'sdate-d',
      sort: 'date_start_calc',
      group: dateGroup('date_start_calc', 'DDMMYYYY', 'L', 'day'),
    },
    {
      label: 'Start date by week',
      id: 'sdate-w',
      sort: 'date_start_calc',
      group: dateGroup('date_start_calc', 'wwgggg', 'ww gggg', 'week'),
    },
    {
      label: 'Start date by month',
      id: 'sdate-m',
      sort: 'date_start_calc',
      group: dateGroup('date_start_calc', 'MMYYYY', 'MMMM YYYY', 'month'),
    },
    {
      label: 'Start date by quarter',
      id: 'sdate-q',
      sort: 'date_start_calc',
      group: dateGroup('date_start_calc', 'QYYYY', 'Q/YYYY', 'quarter'),
    },
    {
      label: 'Timelog by key',
      id: 'log',
      group: group(
        (issue) => (issue.time_logs.length > 0 ? [issue.key] : []),
        (issue) => [issue],
        (field) => `${field.key} - ${field.title}`,
        (issue) => issue,
        () => {
          return null;
        },
      ),
    },
    {
      label: 'Timelog by author',
      id: 'logauthor',
      group: group(
        (issue) =>
          issue.time_logs.map((item) => (item.author ? item.author.id : '')),
        (issue) => issue.time_logs.map((item) => item),
        (field) => (field.author ? field.author.full_name : ''),
        (issue, field) => {
          const i = JSONUtils.jsonClone(issue);
          i.time_logs = [field];
          return i;
        },
        () => {
          return null;
        },
      ),
    },
    {
      label: 'Timelog date by day',
      id: 'log-date-d',
      sort: '__timelog-date-created',
      group: logdateGroup('date_created', 'DDMMYYYY', 'L', 'day'),
    },
    {
      label: 'Timelog date by week',
      id: 'log-date-w',
      sort: '__timelog-date-created',
      group: logdateGroup('date_created', 'WWgggg', 'WW gggg', 'week'),
    },
    {
      label: 'Timelog date by month',
      id: 'log-date-m',
      sort: '__timelog-date-created',
      group: logdateGroup('date_created', 'MMYYYY', 'MMMM YYYY', 'month'),
    },
    {
      label: 'Timelog date by quarter',
      id: 'log-date-q',
      sort: '__timelog-date-created',
      group: logdateGroup('date_created', 'QYYYY', 'Q/YYYY', 'quarter'),
    },
  ];

  static groupViews: BoardGroupsView[] = [
    { label: 'Columns', id: 'columns' },
    { label: 'Rows', id: 'rows' },
  ];

  static issueViews: BoardGroupsCardView[] = [
    { label: 'Vertical', id: 'cards-v' },
    { label: 'Horizontal', id: 'cards-h' },
    { label: 'Horizontal Wrap', id: 'cards-hw' },
  ];
  static cardType: BoardGroupsCardType[] = [
    { label: 'Card', id: 'card' },
    { label: 'List', id: 'list' },
    { label: 'Table', id: 'table' },
    { label: 'Stripe', id: 'stripe' },
    { label: 'Key block', id: 'bar-key' },
    { label: 'Color bar', id: 'bar-color' },
    { label: 'Color bar (estimated)', id: 'bar-estimate' },
    { label: 'Empty', id: '' },
  ];
}

export class BoardGroupsView {
  id: string;
  label: string;
  constructor() {
    this.id = '';
    this.label = '';
  }
}

export class BoardGroupsCardType {
  id: string;
  label: string;
  constructor() {
    this.id = '';
    this.label = '';
  }
}

export class BoardGroupsCardView {
  id: string;
  label: string;
  constructor() {
    this.id = '';
    this.label = '';
  }
}

export class BoardGroupsField {
  id: string;
  label: string;
  init?: initFunction;
  sort?: SortFields;
  dict?: DictKeys;
  group: groupReduceFunction;
  constructor() {
    this.id = '';
    this.label = '';
  }
}

export class BoardGroupsConfigOverride {
  view?: BoardGroupsCardView;
  type?: BoardGroupsCardType;
}
export class BoardGroupsConfig {
  id: string;
  title: string;
  groups: BoardGroupConfig[];
  view: BoardGroupsCardView;
  type: BoardGroupsCardType;
  showLogs: boolean;
  hideParents: boolean;
  collapseEmpty: boolean;
  shared: boolean;
  authorId: string;
  fav?: boolean;

  constructor(title = 'New board') {
    this.id = undefined;
    this.title = title;
    this.groups = [new BoardGroupConfig()];

    this.view = BoardSettings.issueViews[0];
    this.type = BoardSettings.cardType[0];
  }

  static fromServer(serverConfig: BoardGroupsConfigServer): BoardGroupsConfig {
    const config = new BoardGroupsConfig();
    config.id = serverConfig.id;
    config.title = serverConfig.title;
    config.groups = [];
    for (const groupServer of serverConfig.groups) {
      const group = new BoardGroupConfig();
      group.field =
        BoardSettings.groupFields.find(
          (field) => field.id === groupServer.field,
        ) || BoardSettings.groupFields[0];
      group.view =
        BoardSettings.groupViews.find((view) => view.id === groupServer.view) ||
        BoardSettings.groupViews[0];
      group.showEmpty = groupServer.show_empty;
      group.groupOnly = groupServer.group_only;
      group.fixed = groupServer.fixed;
      config.groups.push(group);
    }
    config.view =
      BoardSettings.issueViews.find((view) => view.id === serverConfig.view) ||
      config.view;
    config.type =
      BoardSettings.cardType.find((type) => type.id === serverConfig.type) ||
      config.type;
    config.shared = serverConfig.shared;
    config.showLogs = serverConfig.show_logs;
    config.hideParents = serverConfig.hide_parents;
    config.collapseEmpty = serverConfig.collapse_empty;
    config.authorId = serverConfig.author_id;
    return config;
  }

  toServer() {
    const config: BoardGroupsConfigServer = {
      id: this.id,
      title: this.title,
      groups: [],
      view: this.view.id,
      type: this.type.id,
      shared: this.shared,
      show_logs: this.showLogs,
      hide_parents: this.hideParents,
      collapse_empty: this.collapseEmpty,
      author_id: this.authorId,
    };
    for (const group of this.groups) {
      config.groups.push({
        field: group.field.id,
        view: group.view.id,
        fixed: group.fixed,
        show_empty: group.showEmpty,
        group_only: group.groupOnly,
      });
    }
    return config;
  }
  clone(): BoardGroupsConfig {
    return BoardGroupsConfig.fromServer(this.toServer());
  }
}
export class BoardGroupConfig {
  field: BoardGroupsField;
  view: BoardGroupsView;
  fixed: string[];
  groupOnly: boolean;
  showEmpty: boolean;
  constructor() {
    this.field = BoardSettings.groupFields[0];
    this.view = BoardSettings.groupViews[0];
  }
}
export class BoardGroup {
  config: BoardGroupConfig;
  label: string;
  uid: string;
  id: string;
  parent: BoardGroup;
  issue: Issue;
  sort: Issue;
  items: Issue[];
  groups: BoardGroup[];
  reduce: any;
  groupsMap: Map<string, BoardGroup>;
  constructor(config: BoardGroupConfig) {
    this.uid = '0';
    this.config = config;
    this.items = [];
    this.label = '';
    this.issue = undefined;
    this.sort = undefined;
    this.parent = undefined;
    this.groups = [];
    this.groupsMap = new Map();
  }
}
export interface BoardCheckIssue {
  group: BoardGroup;
  issue: Issue;
  all?: boolean;
}
