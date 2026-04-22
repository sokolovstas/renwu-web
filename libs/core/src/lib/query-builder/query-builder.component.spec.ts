import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
