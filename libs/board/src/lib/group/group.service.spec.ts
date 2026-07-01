import { TestBed } from '@angular/core/testing';
import { RwContainerService, RwDataService } from '@renwu/core';
import { firstValueFrom, of } from 'rxjs';
import {
  BoardGroupConfig,
  BoardGroupsConfig,
  BoardSettings,
  BoardStatusColumnConfig,
} from '../board.model';
import { RwGroupService } from './group.service';

describe('RwGroupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwGroupService,
        {
          provide: RwContainerService,
          useValue: {
            statusMap: new Map([
              ['open', { id: 'open', label: 'Open', sort: 1 }],
              ['reopened', { id: 'reopened', label: 'Reopened', sort: 2 }],
              ['done', { id: 'done', label: 'Done', sort: 3 }],
            ]),
            priorityMap: new Map(),
            typeMap: new Map(),
            resolutionMap: new Map(),
            getMilestones: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: RwDataService,
          useValue: {
            getDictionaryOptions: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(RwGroupService)).toBeTruthy();
  });

  it('groups several statuses into one custom status column', async () => {
    const service = TestBed.inject(RwGroupService);
    await firstValueFrom(service.loadDictionaries('c1'));
    const config = new BoardGroupsConfig('B');
    const group = new BoardGroupConfig();
    group.field = BoardSettings.groupFields.find(
      (field) => field.id === 'status-buckets',
    );
    group.view = BoardSettings.groupViews[0];
    group.showEmpty = true;
    const active = new BoardStatusColumnConfig('Active');
    active.id = 'active';
    active.query = 'status = open,reopened';
    active.targetStatus = 'open';
    const done = new BoardStatusColumnConfig('Done');
    done.id = 'done';
    done.query = 'status = done';
    done.targetStatus = 'done';
    group.statusColumns = [active, done];
    config.groups = [group];

    const root = await firstValueFrom(
      service.group(
        [
          { id: '1', status: { id: 'open', label: 'Open', sort: 1 } },
          { id: '2', status: { id: 'reopened', label: 'Reopened', sort: 2 } },
          { id: '3', status: { id: 'done', label: 'Done', sort: 3 } },
        ],
        config,
        {
          columns: [
            { id: 'active', issue_ids: ['1', '2'], count: 2 },
            { id: 'done', issue_ids: ['3'], count: 1 },
          ],
          issues: [],
        },
      ),
    );

    expect(root.groups.map((g) => `${g.label}:${g.items.length}`)).toEqual([
      'Active:2',
      'Done:1',
    ]);
  });

  it('can group custom status columns by query', async () => {
    const service = TestBed.inject(RwGroupService);
    await firstValueFrom(service.loadDictionaries('c1'));
    const config = new BoardGroupsConfig('B');
    const group = new BoardGroupConfig();
    group.field = BoardSettings.groupFields.find(
      (field) => field.id === 'status-buckets',
    );
    group.view = BoardSettings.groupViews[0];
    group.showEmpty = false;
    const urgent = new BoardStatusColumnConfig('Urgent open');
    urgent.id = 'urgent';
    urgent.query = 'status = open,reopened and priority = High';
    urgent.targetStatus = 'open';
    const other = new BoardStatusColumnConfig('Other open');
    other.id = 'other-open';
    other.query = 'status = open,reopened';
    other.targetStatus = 'open';
    group.statusColumns = [urgent, other];
    config.groups = [group];

    const root = await firstValueFrom(
      service.group(
        [
          {
            id: '1',
            status: { id: 'open', label: 'Open', sort: 1 },
            priority: { id: 'high', label: 'High', sort: 1 },
          },
          {
            id: '2',
            status: { id: 'reopened', label: 'Reopened', sort: 2 },
            priority: { id: 'low', label: 'Low', sort: 2 },
          },
          {
            id: '3',
            status: { id: 'done', label: 'Done', sort: 3 },
            priority: { id: 'high', label: 'High', sort: 1 },
          },
        ],
        config,
        {
          columns: [
            { id: 'urgent', issue_ids: ['1'], count: 1 },
            { id: 'other-open', issue_ids: ['2'], count: 1 },
            { id: '__other', issue_ids: ['3'], count: 1 },
          ],
          issues: [],
        },
      ),
    );

    expect(root.groups.map((g) => `${g.label}:${g.items.length}`)).toEqual([
      'Urgent open:1',
      'Other open:1',
      'Other:1',
    ]);
  });
});
