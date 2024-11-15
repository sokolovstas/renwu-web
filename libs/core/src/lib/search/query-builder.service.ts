import { Injectable, inject } from '@angular/core';

import { Observable, map, of } from 'rxjs';
import { Container } from '../container/container.model';
import { Milestone } from '../container/milestone.model';
import { RwDataService } from '../data/data.service';
import {
  Priority,
  Resolution,
  Status,
  Type,
} from '../settings/dictionary.model';
import { User, UserStatic } from '../user/user.model';
import { OQLParseListener } from './oql/OQLParseListener';
import OQLParser from './oql/OQLParser';
import { SearchHint, SearchHintType, SearchParamType } from './search.model';

@Injectable()
export class RwQueryBuilderService {
  private dataService = inject(RwDataService);

  hints: SearchHint[] = [
    {
      data: 'project',
      label: 'Project',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'type',
      label: 'Type',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'resolution',
      label: 'Resolution',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'priority',
      label: 'Priority',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'status',
      label: 'Status',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'closed',
      label: 'Closed',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.BOOLEAN,
      start: 0,
      stop: 0,
    },
    {
      data: 'completed',
      label: 'Completed',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.BOOLEAN,
      start: 0,
      stop: 0,
    },
    {
      data: 'assignee',
      label: 'Assignee',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'reporter',
      label: 'Reporter',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'label',
      label: 'Label',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'key',
      label: 'Key',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'todo',
      label: 'Todo text',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'title',
      label: 'Title',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'skill',
      label: 'Skill',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'completion',
      label: 'Completion',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'description',
      label: 'Description',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'milestones',
      label: 'Milestone',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'affected_versions',
      label: 'Affected version',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.LIST,
      start: 0,
      stop: 0,
    },
    {
      data: 'text',
      label: 'Text',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.TEXT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start_calc',
      label: 'Estimated date start',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_end_calc',
      label: 'Estimated date end',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start',
      label: 'Date start',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_end',
      label: 'Date end',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_last_update',
      label: 'Date of last update',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_status_changed',
      label: 'Date of last status changed',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start_progress',
      label: 'Date of start progress',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_created',
      label: 'Date of creation',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'time_log_start',
      label: 'Date of time log started',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'time_log_end',
      label: 'Date of time log ended',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.DATE,
      start: 0,
      stop: 0,
    },
    {
      data: 'sort = ',
      label: 'Sort',
      type: SearchHintType.PARAM,
      paramType: SearchParamType.SORT,
      start: 0,
      stop: 0,
    },
  ];

  sortHints: SearchHint[] = [
    {
      data: '_id',
      label: 'Issue ID',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'key',
      label: 'Issue key',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'container.key',
      label: 'Project key',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'milestone.sort',
      label: 'Milestone',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'type.sort',
      label: 'Type',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'resolution.sort',
      label: 'Resolution',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'priority.sort',
      label: 'Priority',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'status.sort',
      label: 'Status',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'status.closed',
      label: 'Closed',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'status.completed',
      label: 'Completed',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'title',
      label: 'Title',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'completion',
      label: 'Completion',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start_calc',
      label: 'Estimated date start',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_end_calc',
      label: 'Estimated date end',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start',
      label: 'Date start',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_end',
      label: 'Date end',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_last_update',
      label: 'Date of last update',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_status_changed',
      label: 'Date of last status changed',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_start_progress',
      label: 'Date of start progress',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
    {
      data: 'date_created',
      label: 'Date of creation',
      type: SearchHintType.SORT,
      start: 0,
      stop: 0,
    },
  ];

  getFieldsHint(query: string, start: number, stop: number): SearchHint[] {
    return this.hints.reduce((acc, item) => {
      item.start = start || 0;
      item.stop = stop || 0;
      if (query && item.label.toLowerCase().indexOf(query) === 0) {
        acc.unshift(item);
      } else if (item.label.toLowerCase().indexOf(query) > -1) {
        acc.push(item);
      }
      return acc;
    }, new Array<SearchHint>());
  }
  getParamType(field: string): string {
    const hint = this.hints.find((item) => item.data === field);
    return hint ? hint.paramType : '';
  }
  getRelopHint(start: number, stop: number): SearchHint[] {
    start = start || 0;
    stop = stop || 0;
    return [
      {
        data: '=',
        label: '=',
        type: SearchHintType.RELOP,
        start: start,
        stop: stop,
      },
      {
        data: '!=',
        label: '!=',
        type: SearchHintType.RELOP,
        start: start,
        stop: stop,
      },
      {
        data: '>',
        label: '>',
        type: SearchHintType.RELOP,
        start: start,
        stop: stop,
      },
      {
        data: '<',
        label: '<',
        type: SearchHintType.RELOP,
        start: start,
        stop: stop,
      },
    ];
  }
  getLogicHint(start: number, stop: number): SearchHint[] {
    start = start || 0;
    stop = stop || 0;
    return [
      {
        data: 'AND',
        label: 'AND',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'OR',
        label: 'OR',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'NOR',
        label: 'NOR',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
    ];
  }
  getLogicHintWithParen(start: number, stop: number): SearchHint[] {
    start = start || 0;
    stop = stop || 0;
    return [
      {
        data: 'AND',
        label: 'AND',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'OR',
        label: 'OR',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'NOR',
        label: 'NOR',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'AND (',
        label: 'AND (...)',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'OR (',
        label: 'OR (...)',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
      {
        data: 'NOR (',
        label: 'NOR (...)',
        type: SearchHintType.LOGIC,
        start: start,
        stop: stop,
      },
    ];
  }
  getLogicHintWithParenAndSort(start: number, stop: number): SearchHint[] {
    return [
      ...this.getLogicHintWithParen(start, stop),
      {
        data: 'sort = ',
        label: 'Sort result by',
        type: SearchHintType.SORT,
        paramType: SearchParamType.SORT,
        start: 0,
        stop: 0,
      },
    ];
  }
  getSortHint(query: string, start: number, stop: number): SearchHint[] {
    return this.sortHints.reduce((acc, item) => {
      item.start = start || 0;
      item.stop = stop || 0;
      if (query && item.label.toLowerCase().indexOf(query) === 0) {
        acc.unshift(item);
      } else if (item.label.toLowerCase().indexOf(query) > -1) {
        acc.push(item);
      }
      return acc;
    }, new Array<SearchHint>());
  }
  getDataHint(
    param: string,
    query: string,
    start: number,
    stop: number,
  ): Observable<SearchHint[]> {
    param = param.trim();
    const filterByLabel = (a: { label: string }, b: { label: string }) => {
      const weightA = getWeight(a.label);
      const weightB = getWeight(b.label);
      if (weightA > weightB) {
        return -1;
      }
      if (weightA < weightB) {
        return 1;
      }
      if (weightA === weightB) {
        if (a.label > b.label) {
          return 1;
        }
        if (a.label < b.label) {
          return -1;
        }
      }
      return 0;
    };
    const filterString = (a: string, b: string) => {
      const weightA = getWeight(a);
      const weightB = getWeight(b);
      if (weightA > weightB) {
        return -1;
      }
      if (weightA < weightB) {
        return 1;
      }
      if (weightA === weightB) {
        if (a > b) {
          return 1;
        }
        if (a < b) {
          return -1;
        }
      }
      return 0;
    };
    const filterByTitle = (
      a: { title: string; key: string },
      b: { title: string; key: string },
    ) => {
      const weightA = getWeight(a.title + (a.key || ''));
      const weightB = getWeight(b.title + (b.key || ''));
      if (weightA > weightB) {
        return -1;
      }
      if (weightA < weightB) {
        return 1;
      }
      if (weightA === weightB) {
        if (a.title > b.title) {
          return 1;
        }
        if (a.title < b.title) {
          return -1;
        }
      }
      return 0;
    };
    const mapString = (item: string) => {
      return {
        data: item,
        label: item,
        type: SearchHintType.VALUE,
        start: start,
        stop: stop,
      };
    };
    const mapByLabel = (item: { label: string }) => {
      return {
        data: item.label,
        label: item.label,
        type: SearchHintType.VALUE,
        start: start,
        stop: stop,
      };
    };
    const mapMilestones = (item: Milestone) => {
      return {
        data: item.title,
        label: `${item.title} (${item.container.title})`,
        type: SearchHintType.VALUE,
        start: start,
        stop: stop,
      };
    };
    const mapContainer = (item: Container) => {
      return {
        data: item.key,
        label: `${item.title} (${item.key})`,
        type: SearchHintType.VALUE,
        start: start,
        stop: stop,
      };
    };
    const mapUser = (item: User) => {
      return {
        data: item.username,
        label: `${item.full_name} (${item.username})`,
        type: SearchHintType.VALUE,
        start: start,
        stop: stop,
      };
    };
    const getWeight = (string: string) => {
      const index = string
        .trim()
        .toLowerCase()
        .indexOf(query.trim().toLowerCase());
      if (index === 0) {
        return 1;
      }
      if (index > 0) {
        return 0.5;
      }
      if (index === -1) {
        return 0;
      }
      return 0;
    };
    switch (param) {
      case 'type':
        return this.dataService.getDictionary<Type>('dictionary/type').pipe(
          map((items) => {
            return items.sort(filterByLabel).map(mapByLabel);
          }),
        );
      case 'resolution':
        return this.dataService
          .getDictionary<Resolution>('dictionary/resolution')
          .pipe(
            map((items) => {
              const resolutions = items.sort(filterByLabel).map(mapByLabel);
              resolutions.unshift({
                data: 'Unresolved',
                label: 'Unresolved',
                type: SearchHintType.VALUE,
                start: start,
                stop: stop,
              });
              return resolutions;
            }),
          );
      case 'status':
        return this.dataService.getDictionary<Status>('dictionary/status').pipe(
          map((items) => {
            return items.sort(filterByLabel).map(mapByLabel);
          }),
        );
      case 'priority':
        return this.dataService
          .getDictionary<Priority>('dictionary/priority')
          .pipe(
            map((items) => {
              return items.sort(filterByLabel).map(mapByLabel);
            }),
          );
      case 'label':
        return this.dataService.getDictionary<string>('dictionary/labels').pipe(
          map((items) => {
            return items.sort(filterString).map(mapString);
          }),
        );
      case 'project':
        return this.dataService
          .getDictionaryOptions<Container>('container')
          .pipe(
            map((items) => {
              return [
                {
                  data: 'any',
                  label: `Any`,
                  type: SearchHintType.VALUE,
                  start: start,
                  stop: stop,
                },
                ...items.results.sort(filterByTitle).map(mapContainer),
              ];
            }),
          );
      case 'skill':
        return this.dataService
          .getDictionaryOptions<string>('dictionary/skills')
          .pipe(
            map((items) => {
              return items.results.sort(filterString).map(mapString);
            }),
          );
      case 'assignee':
      case 'reporter':
        return this.dataService.getDictionary('user/options').pipe(
          map((items) => {
            return [
              {
                label: 'Current user',
                data: '$me',
                type: SearchHintType.VALUE,
                start: start,
                stop: stop,
              },
              ...items
                .sort((a: User, b: User) => {
                  return UserStatic.compareForSearch(a, b, query);
                })
                .map(mapUser),
            ];
          }),
        );
      case 'milestones':
      case 'milestone':
      case 'affected_versions':
        return this.dataService
          .getDictionaryOptions<Milestone>('milestone')
          .pipe(
            map((items) => {
              return items.results.sort(filterByTitle).map(mapMilestones);
            }),
          );
      case 'closed':
      case 'completed':
        return of([
          {
            data: 'true',
            label: 'true',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: 'false',
            label: 'false',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
        ]);
      case 'date_start':
      case 'date_end':
      case 'date_last_update':
      case 'date_status_changed':
      case 'date_start_progress':
      case 'date_created':
      case 'time_log_start':
      case 'time_log_end':
        return of([
          {
            data: '-3h',
            label: '3 hours ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-6h',
            label: '6 hours ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-12h',
            label: '12 hours ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-24h',
            label: '24 hours ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-2d',
            label: '2 days ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-7d',
            label: '7 days ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-30d',
            label: '30 days ago',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: 'now/d',
            label: 'Today',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-1d/d',
            label: 'Yesterday',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-2d/d',
            label: 'Day before yesterday',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-7d/d',
            label: 'This day last week',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: '-1w/w',
            label: 'Previous week',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: 'now/w',
            label: 'This week',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
          {
            data: 'now/M',
            label: 'This month',
            type: SearchHintType.VALUE,
            start: start,
            stop: stop,
          },
        ]);
    }
    return of(new Array<SearchHint>());
  }

  getHints(query: string, position: number): Observable<SearchHint[]> {
    const searchPosition = position;
    if (position > query.length) {
      position = query.length;
    }
    const visitor = new OQLParseListener(query);
    const parserRule =
      visitor.findContextInPosition(position) ||
      visitor.findContextInPosition(position - 1);
    const expressionRule =
      visitor.findExpContextInPosition(position) ||
      visitor.findExpContextInPosition(position - 1);

    let searchString = '';

    if (parserRule) {
      searchString = query.slice(parserRule.start, searchPosition);

      if (
        !(
          position === query.length ||
          (expressionRule && expressionRule.stop === position - 1)
        )
      ) {
        searchString = '';
      }

      if (expressionRule && expressionRule.type === OQLParser.RULE_sortAtom) {
        if (parserRule.type === OQLParser.RULE_value) {
          return of(
            this.getSortHint(
              searchString,
              parserRule.start,
              parserRule.stop + 1,
            ),
          );
        }
      }

      if (parserRule.type === OQLParser.RULE_field) {
        return of(
          this.getFieldsHint(
            searchString,
            parserRule.start,
            parserRule.stop + 1,
          ),
        );
      }

      if (parserRule.type === OQLParser.RULE_relop) {
        return of(this.getRelopHint(parserRule.start, parserRule.stop + 1));
      }

      if (parserRule.type === OQLParser.RULE_value) {
        const fieldParserRule = visitor.index[parserRule.index - 2];
        searchString = searchString.slice(1);
        return this.getDataHint(
          fieldParserRule.context.getText(),
          searchString,
          parserRule.start,
          parserRule.stop + 1,
        );
      }
      if (parserRule.type === OQLParser.RULE_logic) {
        return of(this.getLogicHint(parserRule.start, parserRule.stop + 1));
      }
    } else {
      if (position === 0 && query.length === 0) {
        return of(this.getFieldsHint(searchString, 0, 0));
      }
    }

    return of(new Array<SearchHint>());
  }
  setHint(
    query: string,
    hint: SearchHint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pos: number,
  ): { query: string; position: number } {
    let position: number = query.length;

    const prev = query.slice(0, hint.start);
    const after = query.slice(hint.stop);
    const hintString = this.convertHintDataToString(hint);

    query = [prev, hintString, after].join('');
    query = query.replaceAll('  ', ' ');

    position = prev.length + hintString.length;

    return { query, position };
  }
  convertHintDataToString(hint: SearchHint): string {
    if (hint.paramType === SearchParamType.SORT) {
      return hint.data;
    }
    if (hint.data.indexOf(' ') > -1) {
      return [' "', hint.data, '" '].join('');
    } else {
      return [' ', hint.data, ' '].join('');
    }
  }
}
