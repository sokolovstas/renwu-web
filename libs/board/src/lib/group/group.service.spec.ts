jest.mock('@renwu/core', () => ({
  RwContainerService: class RwContainerService {},
  RwDataService: class RwDataService {},
}));

import { TestBed } from '@angular/core/testing';
import { Issue, RwContainerService, RwDataService } from '@renwu/core';
import { firstValueFrom, of } from 'rxjs';
import { BoardGroupConfig, BoardGroupsConfig, BoardSettings } from '../board.model';
import { RwGroupService } from './group.service';

describe('RwGroupService', () => {
  let containerService: {
    statusMap: Map<string, unknown>;
    priorityMap: Map<string, unknown>;
    typeMap: Map<string, unknown>;
    resolutionMap: Map<string, unknown>;
    getMilestones: jest.Mock;
  };
  let dataService: { getDictionaryOptions: jest.Mock };
  let service: RwGroupService;

  beforeEach(() => {
    containerService = {
      statusMap: new Map([['s1', { id: 's1', label: 'Open' }]]),
      priorityMap: new Map(),
      typeMap: new Map(),
      resolutionMap: new Map(),
      getMilestones: jest.fn(() => of([{ id: 'm1', title: 'Sprint 1', sort: 1 }])),
    };
    dataService = {
      getDictionaryOptions: jest.fn((destination: string) =>
        destination.includes('labels')
          ? of(['bug', 'urgent'])
          : of({ results: ['frontend', 'backend'] }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        RwGroupService,
        { provide: RwContainerService, useValue: containerService },
        { provide: RwDataService, useValue: dataService },
      ],
    });
    service = TestBed.inject(RwGroupService);
  });

  describe('loadDictionaries', () => {
    it('assembles milestones/skills/labels and populates the dictionaries map', async () => {
      const [milestones, skills, labels] = await firstValueFrom(
        service.loadDictionaries('container-1'),
      );

      expect(milestones).toEqual([{ id: 'm1', title: 'Sprint 1', sort: 1 }]);
      expect(skills).toEqual(['frontend', 'backend']);
      expect(labels).toEqual(['bug', 'urgent']);

      // milestones dictionary is prefixed with a synthetic "Unplanned" entry
      expect(service.dictionaries.get('milestones')).toEqual([
        { id: 'null', title: 'Unplanned', sort: -1 },
        { id: 'm1', title: 'Sprint 1', sort: 1 },
      ]);
      expect(service.dictionaries.get('skills')).toEqual(['frontend', 'backend']);
      expect(service.dictionaries.get('labels')).toEqual(['bug', 'urgent']);
    });

    // Object.keys() on a real Map always returns [] (Map entries are not
    // own enumerable properties), so the statuses/priorities/types/
    // resolutions dictionaries built this way are always empty regardless
    // of what the container service's maps actually contain. Documented
    // here as current (likely unintended) behavior.
    it('always populates statuses/priorities/types/resolutions as empty arrays', async () => {
      await firstValueFrom(service.loadDictionaries('container-1'));

      expect(service.dictionaries.get('statuses')).toEqual([]);
      expect(service.dictionaries.get('priorities')).toEqual([]);
      expect(service.dictionaries.get('types')).toEqual([]);
      expect(service.dictionaries.get('resolutions')).toEqual([]);
    });

    it('falls back to empty arrays when the server returns null milestones', async () => {
      containerService.getMilestones.mockReturnValue(of(null));

      const [milestones] = await firstValueFrom(
        service.loadDictionaries('container-1'),
      );

      expect(milestones).toEqual([]);
      expect(service.dictionaries.get('milestones')).toEqual([
        { id: 'null', title: 'Unplanned', sort: -1 },
      ]);
    });
  });

  describe('group', () => {
    function statusConfig(showEmpty = false): BoardGroupsConfig {
      const config = new BoardGroupsConfig('Test board');
      const group = new BoardGroupConfig();
      group.field = BoardSettings.groupFields.find((f) => f.id === 'status');
      group.view = BoardSettings.groupViews[0];
      group.showEmpty = showEmpty;
      config.groups = [group];
      return config;
    }

    const issues: Issue[] = [
      { id: 'i1', status: { id: 's1', label: 'Open' } as any },
      { id: 'i2', status: { id: 's1', label: 'Open' } as any },
      { id: 'i3', status: { id: 's2', label: 'Done' } as any },
    ];

    it('builds a root group with one child group per distinct status', async () => {
      const root = await firstValueFrom(service.group(issues, statusConfig()));

      expect(root.uid).toBe('root');
      expect(root.groups).toHaveLength(2);

      const open = root.groups.find((g) => g.id === 's1');
      const closed = root.groups.find((g) => g.id === 's2');

      expect(open.uid).toBe('root-s1');
      expect(open.items).toHaveLength(2);
      expect(open.label).toBe('Open');
      expect(open.parent).toBe(root);

      expect(closed.items).toHaveLength(1);
      expect(closed.label).toBe('Done');
    });

    it('filters out issues with children when hideParents is set', async () => {
      const config = statusConfig();
      config.hideParents = true;
      const issuesWithParent: Issue[] = [
        ...issues,
        { id: 'i4', have_childs: true, status: { id: 's1', label: 'Open' } as any },
      ];

      const root = await firstValueFrom(service.group(issuesWithParent, config));

      const total = root.groups.reduce((sum, g) => sum + g.items.length, 0);
      expect(total).toBe(3);
    });

    it('returns a single root group with no children for an empty issue list', async () => {
      const root = await firstValueFrom(service.group([], statusConfig()));

      expect(root.groups).toHaveLength(0);
      expect(root.items).toEqual([]);
    });
  });
});
