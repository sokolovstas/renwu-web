import {
  createQueryWidget,
  defaultWidgets,
  reorderWidgets,
  widgetsFromSettings,
} from './dashboard.defaults';

describe('dashboard.defaults', () => {
  it('returns morning layout when settings are empty', () => {
    const widgets = widgetsFromSettings(undefined);
    expect(widgets.map((w) => w.id)).toEqual([
      'default-my-work',
      'default-recent',
      'default-watched',
    ]);
    expect(widgets[0].groupBy).toBe('schedule');
    expect(widgets[0].cols).toBe(2);
  });

  it('keeps a saved custom widget', () => {
    const custom = createQueryWidget({
      id: 'w1',
      title: 'Bugs',
      query: 'type = Bug completed = false',
      cols: 1,
    });
    const widgets = widgetsFromSettings({ widgets: [custom] });
    expect(widgets).toHaveLength(1);
    expect(widgets[0].title).toBe('Bugs');
    expect(widgets[0].query).toContain('Bug');
  });

  it('reorders widgets', () => {
    const widgets = defaultWidgets();
    const next = reorderWidgets(widgets, 0, 2);
    expect(next.map((w) => w.id)).toEqual([
      'default-recent',
      'default-watched',
      'default-my-work',
    ]);
  });
});
