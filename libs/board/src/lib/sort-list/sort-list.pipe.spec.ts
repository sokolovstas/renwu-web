import { SortListPipe } from 'web/shared/pipes/sort-list.pipe';
import { Issue } from 'web/model/issue.model';
import { async } from '@angular/core/testing';
import { ListOptions } from 'web/model/sort.model';

fdescribe('SortListPipe', () => {
  let pipe: SortListPipe;

  const issueA: Issue = {
    key: 'PMP-1240',
    title: 'Issue 1',
    completion: 0,
    date_created: '2018-02-22T11:53:31.367Z',
    status: { id: 's1' },
    priority: { id: 'p1' },
    type: { id: 't1' },
    assignes: [{ username: 'user1', full_name: 'User 1' }],
    milestones: [
      { title: 'Milestone 1', sort: 1 },
      { title: 'Milestone 2', sort: 2 },
    ],
    affected_versions: [{ title: 'Milestone 1' }, { title: 'Milestone 2' }],
  };
  const issueB: Issue = {
    key: 'PMP-1440',
    title: 'Issue 2',
    completion: 50,
    date_created: '2018-02-23T11:53:31.367Z',
    status: { id: 's2' },
    priority: { id: 'p2' },
    type: { id: 't2' },
    assignes_calc: [{ username: 'user2', full_name: 'User 2' }],
    parent_milestones: [
      { title: 'Milestone 1', sort: 2 },
      { title: 'Milestone 3', sort: 3 },
    ],
    affected_versions: [{ title: 'Milestone 1' }, { title: 'Milestone 3' }],
  };
  const issueC: Issue = {
    key: 'PMP-1640',
    title: 'Issue 5',
    completion: 90,
    date_created: '2018-02-23T11:53:32.367Z',
    status: { id: 's3' },
    priority: { id: 'p3' },
    type: { id: 't3' },
    assignes_calc: [{ username: 'user3', full_name: 'User 3' }],
    milestones: [
      { title: 'Milestone 3', sort: 3 },
      { title: 'Milestone 4', sort: 4 },
    ],
    affected_versions: [{ title: 'Milestone 4' }, { title: 'Milestone 5' }],
  };
  const issueEmptyArray: Issue = {
    assignes: [],
    milestones: [],
  };
  const issueEmptyObject: Issue = {
    assignes: [{}],
    milestones: [{}],
  };
  const issueEmptyValue: Issue = {
    key: '',
    title: '',
    completion: null,
    date_created: 'fake date',
    status: {},
    priority: {},
    type: {},
    assignes: [{ username: '', full_name: '' }],
    milestones: [{ title: '' }],
  };

  const containerService: any = {
    statusMap: {
      s1: {
        id: 's1',
        sort: 0,
      },
      s2: {
        id: 's2',
        sort: 2,
      },
      s3: {
        id: 's3',
        sort: 3,
      },
    },
    priorityMap: {
      p1: {
        id: 'p1',
        sort: 0,
      },
      p3: {
        id: 'p3',
        sort: 2,
      },
    },
    typeMap: {
      t1: {
        id: 't1',
        sort: 0,
      },
      t2: {
        id: 't2',
      },
      t3: {
        id: 't3',
        sort: 2,
      },
    },
  };

  const empty: Issue = {};
  const nulled: Issue = null;
  const issues: Issue[] = [
    issueA,
    issueB,
    issueEmptyArray,
    issueEmptyObject,
    issueEmptyValue,
    empty,
    nulled,
    issueC,
  ];
  const options: ListOptions = new ListOptions();

  beforeEach(async(() => {
    pipe = new SortListPipe(containerService);
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
  it('getDirectionSort', () => {
    pipe.direction = 'up';
    expect(pipe.getDirectionSort(1)).toBe(1);
    expect(pipe.getDirectionSort(-1)).toBe(-1);
    pipe.direction = 'down';
    expect(pipe.getDirectionSort(1)).toBe(-1);
    expect(pipe.getDirectionSort(-1)).toBe(1);
  });
  it('zeroPaddingkey', () => {
    expect(pipe.zeroPadding('250', 5)).toBe('00250');
    expect(pipe.zeroPadding('1250', 5)).toBe('01250');
    expect(pipe.zeroPaddingKey('PMP-250')).toBe('0000000250');
  });

  it('Check empty removing', () => {
    options.sort = { field: 'key', direction: 'up' };
    const up = pipe.transform(issues, options);
    expect(up.indexOf(nulled)).toBe(-1);
    options.sort = { field: 'key', direction: 'down' };
    const down = pipe.transform(issues, options);
    expect(down.indexOf(nulled)).toBe(-1);
  });

  const defaultExpectUp = (sort) => {
    expect(sort.indexOf(issueA)).toBe(0);
    expect(sort.indexOf(issueB)).toBe(1);
    expect(sort.indexOf(issueC)).toBe(2);
    expect(sort.indexOf(empty)).toBe(6);
  };

  const defaultExpectDown = (sort) => {
    expect(sort.indexOf(issueA)).toBe(2);
    expect(sort.indexOf(issueB)).toBe(1);
    expect(sort.indexOf(issueC)).toBe(0);
    expect(sort.indexOf(empty)).toBe(6);
  };

  const defaultExpectUpNullUp = (sort) => {
    expect(sort.indexOf(issueA)).toBe(4);
    expect(sort.indexOf(issueB)).toBe(5);
    expect(sort.indexOf(issueC)).toBe(6);
    expect(sort.indexOf(empty)).toBe(3);
  };

  const defaultExpectDownNullUp = (sort) => {
    expect(sort.indexOf(issueA)).toBe(6);
    expect(sort.indexOf(issueB)).toBe(5);
    expect(sort.indexOf(issueC)).toBe(4);
    expect(sort.indexOf(empty)).toBe(3);
  };

  it('Sort by key', () => {
    options.sort = { field: 'key', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'key', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'key', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'key', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by assignes', () => {
    options.sort = { field: 'assignes', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'assignes', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'assignes', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'assignes', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by milestones', () => {
    options.sort = { field: 'milestones', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'milestones', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'milestones', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'milestones', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by milestones.sort', () => {
    options.sort = { field: 'milestones.sort', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'milestones.sort', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'milestones.sort', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'milestones.sort', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by affected_versions', () => {
    options.sort = { field: 'affected_versions', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'affected_versions', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'affected_versions', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'affected_versions', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by string field (e.g. title)', () => {
    options.sort = { field: 'title', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'title', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'title', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'title', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by number field (e.g. completion)', () => {
    options.sort = { field: 'completion', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'completion', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'completion', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'completion', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by date field (e.g. date_created)', () => {
    options.sort = { field: 'date_created', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'date_created', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'date_created', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'date_created', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by dictionary with full map (e.g. status)', () => {
    options.sort = { field: 'milestones', direction: 'up' };
    defaultExpectUp(pipe.transform(issues, options));
    options.sort = { field: 'milestones', direction: 'down' };
    defaultExpectDown(pipe.transform(issues, options));
    options.sort = { field: 'milestones', direction: 'up' };
    defaultExpectUpNullUp(pipe.transform(issues, options, 'up'));
    options.sort = { field: 'milestones', direction: 'down' };
    defaultExpectDownNullUp(pipe.transform(issues, options, 'up'));
  });

  it('Sort by dictionary with missing map (e.g. priority)', () => {
    options.sort = { field: 'priority', direction: 'up' };
    const up = pipe.transform(issues, options);
    expect(up.indexOf(issueA)).toBe(0);
    expect(up.indexOf(issueC)).toBe(1);
    expect(up.indexOf(issueB)).toBe(2);
    expect(up.indexOf(empty)).toBe(6);
    options.sort = { field: 'priority', direction: 'up' };
    const upNullUp = pipe.transform(issues, options, 'up');
    // IssueB have missing sort
    expect(upNullUp.indexOf(issueB)).toBe(0);
    expect(upNullUp.indexOf(empty)).toBe(4);
    expect(upNullUp.indexOf(issueA)).toBe(5);
    expect(upNullUp.indexOf(issueC)).toBe(6);
    options.sort = { field: 'priority', direction: 'down' };
    const down = pipe.transform(issues, options);
    // Filled value is more important
    expect(down.indexOf(issueC)).toBe(0);
    expect(down.indexOf(issueA)).toBe(1);
    expect(down.indexOf(issueB)).toBe(2);
    expect(down.indexOf(empty)).toBe(6);
    options.sort = { field: 'priority', direction: 'down' };
    const downNullUp = pipe.transform(issues, options, 'up');
    // Filled value is more important
    // IssueB have missing sort
    expect(downNullUp.indexOf(issueB)).toBe(0);
    expect(downNullUp.indexOf(empty)).toBe(4);
    expect(downNullUp.indexOf(issueC)).toBe(5);
    expect(downNullUp.indexOf(issueA)).toBe(6);
  });

  it('Sort by dictionary with partial map (e.g. type)', () => {
    options.sort = { field: 'type', direction: 'up' };
    const up = pipe.transform(issues, options);
    expect(up.indexOf(issueA)).toBe(0);
    expect(up.indexOf(issueC)).toBe(1);
    expect(up.indexOf(issueB)).toBe(2);
    expect(up.indexOf(empty)).toBe(6);
    options.sort = { field: 'type', direction: 'up' };
    const upNullUp = pipe.transform(issues, options, 'up');
    // IssueB have missing sort
    expect(upNullUp.indexOf(issueB)).toBe(0);
    expect(upNullUp.indexOf(empty)).toBe(4);
    expect(upNullUp.indexOf(issueA)).toBe(5);
    expect(upNullUp.indexOf(issueC)).toBe(6);
    options.sort = { field: 'type', direction: 'down' };
    const down = pipe.transform(issues, options);
    // Filled value is more important
    expect(down.indexOf(issueC)).toBe(0);
    expect(down.indexOf(issueA)).toBe(1);
    expect(down.indexOf(issueB)).toBe(2);
    expect(down.indexOf(empty)).toBe(6);
    options.sort = { field: 'type', direction: 'down' };
    const downNullUp = pipe.transform(issues, options, 'up');
    // Filled value is more important
    // IssueB have missing sort
    expect(downNullUp.indexOf(issueB)).toBe(0);
    expect(downNullUp.indexOf(empty)).toBe(4);
    expect(downNullUp.indexOf(issueC)).toBe(5);
    expect(downNullUp.indexOf(issueA)).toBe(6);
  });
});
