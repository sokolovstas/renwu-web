import { TestBed } from '@angular/core/testing';
import { OQLParseListener } from './OQLParseListener';

describe('OQLParseListener', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [],
    }),
  );

  it('should parse', () => {
    const p = new OQLParseListener('');
    expect(p.errors.length).toBe(0);
    p.parseOQL('status = Open sort = -date_start_calc');
    expect(p.errors.length).toBe(0);
    expect(p.index.length).toBe(4);
  });
  it('should find atom and context', () => {
    const p = new OQLParseListener('status = Open sort = -date_start_calc');
    expect(p.findAtomByName('status').length).toBe(1);
    expect(p.findContextInPosition(2).start).toBe(0);
    expect(p.findContextInPosition(2).stop).toBe(5);
    expect(p.findExpContextInPosition(2).start).toBe(0);
    expect(p.findExpContextInPosition(2).stop).toBe(12);
  });
  it('should set atom by name', () => {
    const p = new OQLParseListener('status = Open sort = -date_start_calc');
    expect(p.getValueInAtom('status', 2)).toBe('Open');
    p.setValueInAtom('status', 2, 'In progress');
    expect(p.query).toBe('status = "In progress" sort = -date_start_calc');
    expect(p.getValueInAtom('status', 2)).toBe('In progress');
    p.setValueInAtom('status', 2, 'Open');
    expect(p.query).toBe('status = Open sort = -date_start_calc');
    expect(p.getValueInAtom('status', 2)).toBe('Open');
  });
  it('should switch atom by name', () => {
    const p = new OQLParseListener('status = Open sort = -date_start_calc');

    // with spaces
    p.switchValueInAtom('type', 2, 'Feature request');
    expect(p.query).toBe(
      'type = "Feature request" status = Open sort = -date_start_calc',
    );

    p.switchValueInAtom('type', 2, 'Feature request');
    expect(p.query).toBe('status = Open sort = -date_start_calc');

    // without spaces
    p.switchValueInAtom('type', 2, 'Bug');
    expect(p.query).toBe('type = Bug status = Open sort = -date_start_calc');

    p.switchValueInAtom('type', 2, 'Bug');
    expect(p.query).toBe('status = Open sort = -date_start_calc');

    // change exist
    p.switchValueInAtom('status', 2, 'Closed');
    expect(p.query).toBe('status = Closed sort = -date_start_calc');

    // change sort
    p.switchValueInAtom('sort', 2, 'date_start');
    expect(p.query).toBe('status = Closed sort = date_start');
  });
});
