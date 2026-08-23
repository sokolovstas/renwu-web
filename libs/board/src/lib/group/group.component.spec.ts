jest.mock('@renwu/core', () => ({
  RwContainerService: class RwContainerService {},
  RwSettingsService: class RwSettingsService {},
}));

jest.mock('@renwu/components', () => {
  const { Component, Input, Output, EventEmitter } = require('@angular/core');

  const RwIconComponent = class {};
  Component({
    selector: 'rw-icon',
    standalone: true,
    template: '',
  })(RwIconComponent);
  Input()(RwIconComponent.prototype, 'states');
  Input()(RwIconComponent.prototype, 'state');

  const RwButtonComponent = class {
    constructor() {
      this.clicked = new EventEmitter();
    }
  };
  Component({
    selector: 'rw-button',
    standalone: true,
    template: '<ng-content />',
  })(RwButtonComponent);
  Input()(RwButtonComponent.prototype, 'typeButton');
  Input()(RwButtonComponent.prototype, 'iconClass');
  Input()(RwButtonComponent.prototype, 'iconSize');
  Output()(RwButtonComponent.prototype, 'clicked');

  return { RwIconComponent, RwButtonComponent };
});

jest.mock('@jsverse/transloco', () => {
  const { Pipe } = require('@angular/core');
  const TranslocoPipe = class {
    transform(key: string) {
      return key;
    }
  };
  Pipe({ name: 'transloco', standalone: true, pure: true })(TranslocoPipe);
  return { TranslocoPipe };
});

import { TestBed } from '@angular/core/testing';
import { RwContainerService, RwSettingsService } from '@renwu/core';
import { BoardGroup, BoardGroupConfig, BoardGroupsConfig, BoardSettings } from '../board.model';
import { BoardGroupComponent } from './group.component';

describe('BoardGroupComponent', () => {
  let settingsService: {
    user: { settings: { open_index_group: Record<string, boolean> } };
  };

  function createComponent() {
    TestBed.configureTestingModule({
      imports: [BoardGroupComponent],
      providers: [
        { provide: RwSettingsService, useValue: settingsService },
        { provide: RwContainerService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(BoardGroupComponent);
    return { fixture, component: fixture.componentInstance };
  }

  function makeConfig(): BoardGroupsConfig {
    return new BoardGroupsConfig('Test board');
  }

  function makeGroup(overrides: Partial<BoardGroup> = {}): BoardGroup {
    const group = new BoardGroup(new BoardGroupConfig());
    Object.assign(group, overrides);
    return group;
  }

  beforeEach(() => {
    settingsService = { user: { settings: { open_index_group: {} } } };
  });

  describe('group input setter', () => {
    it('splits child groups into fixed and non-fixed based on the parent config', () => {
      const { component } = createComponent();

      const fixedChild = makeGroup({ id: 'g1' });
      const freeChild = makeGroup({ id: 'g2' });
      const parentConfig = new BoardGroupConfig();
      parentConfig.fixed = ['g1'];
      fixedChild.parent = makeGroup({ config: parentConfig });
      freeChild.parent = makeGroup({ config: parentConfig });

      const group = makeGroup({ uid: 'root-x', groups: [fixedChild, freeChild] });
      component.group = group;

      expect(component.groupsFixed).toEqual([fixedChild]);
      expect(component.groupsNotFixed).toEqual([freeChild]);
      expect(component.uid).toBe('root-x');
      expect(component.last).toBeFalsy();
    });

    it('marks the component as the last group when it has no child groups', () => {
      const { component } = createComponent();
      component.group = makeGroup({ groups: [] });
      expect(component.last).toBe(true);
    });

    it('ignores a falsy value (no-op)', () => {
      const { component } = createComponent();
      const before = component.group;
      component.group = undefined as unknown as BoardGroup;
      expect(component.group).toBe(before);
    });
  });

  describe('collapsed', () => {
    it('reflects the open_index_group setting for the group uid', () => {
      const { component } = createComponent();
      const group = makeGroup({ uid: 'g1', groups: [makeGroup()] });
      component.group = group;
      component.config = makeConfig();

      expect(component.collapsed).toBe(false);

      settingsService.user.settings.open_index_group['g1'] = true;
      expect(component.collapsed).toBe(true);
    });

    it('forces collapsed when the group and its items are empty and collapseEmpty is set', () => {
      const { component } = createComponent();
      component.group = makeGroup({ uid: 'g1', groups: [], items: [] });
      component.config = makeConfig();
      component.config.collapseEmpty = true;

      expect(component.collapsed).toBe(true);
    });

    it('is false when there is no group', () => {
      const { component } = createComponent();
      component.config = makeConfig();
      expect(component.collapsed).toBe(false);
    });
  });

  describe('groupOnly / rootGroup', () => {
    it('groupOnly reads from the parent group config', () => {
      const { component } = createComponent();
      const parentConfig = new BoardGroupConfig();
      parentConfig.groupOnly = true;
      component.parentGroup = makeGroup({ config: parentConfig });

      expect(component.groupOnly).toBe(true);
    });

    it('groupOnly is false without a parent group', () => {
      const { component } = createComponent();
      expect(component.groupOnly).toBe(false);
    });

    it('rootGroup is true only for the group with uid "root"', () => {
      const { component } = createComponent();
      component.group = makeGroup({ uid: 'root', groups: [] });
      expect(component.rootGroup).toBe(true);

      component.group = makeGroup({ uid: 'root-x', groups: [] });
      expect(component.rootGroup).toBe(false);
    });
  });

  describe('collapse()', () => {
    it('toggles the open_index_group flag for the current group and persists it back', () => {
      const { component } = createComponent();
      component.group = makeGroup({ uid: 'g1', groups: [] });

      component.collapse();
      expect(settingsService.user.settings.open_index_group['g1']).toBe(true);

      component.collapse();
      expect(settingsService.user.settings.open_index_group['g1']).toBe(false);
    });
  });

  describe('onIssueCheck / onAddTask', () => {
    it('re-emits the check event received from a child', () => {
      const { component } = createComponent();
      const payload = { group: makeGroup(), issue: {}, all: false };
      const emitted: unknown[] = [];
      component.check.subscribe((e) => emitted.push(e));

      component.onIssueCheck(payload);

      expect(emitted).toEqual([payload]);
    });

    it('re-emits the addTask event received from a child', () => {
      const { component } = createComponent();
      const group = makeGroup();
      const emitted: BoardGroup[] = [];
      component.addTask.subscribe((g) => emitted.push(g));

      component.onAddTask(group);

      expect(emitted).toEqual([group]);
    });
  });

  describe('isCardLayoutView', () => {
    it.each([
      ['cards-v', true],
      ['cards-h', true],
      ['cards-hw', true],
      ['table', false],
      ['list', false],
      [undefined, false],
    ])('isCardLayoutView(%s) -> %s', (viewId, expected) => {
      const { component } = createComponent();
      expect(component.isCardLayoutView(viewId)).toBe(expected);
    });
  });

  describe('flex / width', () => {
    it('collapses to a fixed narrow width inside a "columns" parent', () => {
      const { component } = createComponent();
      const parentConfig = new BoardGroupConfig();
      parentConfig.view = BoardSettings.groupViews.find((v) => v.id === 'columns');
      component.parentGroup = makeGroup({ config: parentConfig });
      component.group = makeGroup({ uid: 'g1', groups: [] });
      component.config = makeConfig();
      settingsService.user.settings.open_index_group['g1'] = true;

      expect(component.flex).toBe('0 0 43px');
      expect(component.width).toBe('43px');
    });

    it('defaults to filling the available space with no parent group', () => {
      const { component } = createComponent();
      component.group = makeGroup({ uid: 'root', groups: [] });
      component.config = makeConfig();

      expect(component.flex).toBe('1 1 100%');
      expect(component.width).toBe('100%');
    });
  });

  describe('markForCheck', () => {
    it('marks itself and all child group components for check', () => {
      const { component, fixture } = createComponent();
      component.group = makeGroup({ uid: 'root', groups: [] });
      component.config = makeConfig();
      fixture.detectChanges();

      const childMarkForCheck = jest.fn();
      component.groups = [{ markForCheck: childMarkForCheck }] as unknown as typeof component.groups;

      expect(() => component.markForCheck()).not.toThrow();
      expect(childMarkForCheck).toHaveBeenCalledTimes(1);
    });
  });
});
