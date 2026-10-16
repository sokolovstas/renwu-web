import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { RwQueryBuilderService } from '../search/query-builder.service';
import { QueryBuilderComponent } from './query-builder.component';

describe('QueryBuilderComponent', () => {
  let fixture: ComponentFixture<QueryBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryBuilderComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwQueryBuilderService, useValue: {} },
        {
          provide: RwDataService,
          useValue: {
            getSearchQueries: () => of([]),
            searchHistory: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('clears the query from the search field', () => {
    const emitted: string[] = [];
    fixture.componentInstance.queryChange.subscribe((query) =>
      emitted.push(query),
    );
    fixture.componentInstance.query = 'parent = "VKVIDEO-98393"';
    fixture.detectChanges();

    const clear = fixture.nativeElement.querySelector(
      '.icon-clear',
    ) as HTMLElement;
    expect(clear).toBeTruthy();
    clear.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(fixture.componentInstance.queryString()).toBe('');
    expect(emitted).toEqual(['']);
  });
});
