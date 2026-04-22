import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwSettingsService } from '../../settings/settings.service';
import { IssueHistoryItemComponent } from './history-item.component';

describe('IssueHistoryItemComponent', () => {
  let fixture: ComponentFixture<IssueHistoryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueHistoryItemComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwSettingsService, useValue: { user: {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueHistoryItemComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
