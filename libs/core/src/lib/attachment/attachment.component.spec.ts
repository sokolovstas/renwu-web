import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwToastService } from '@renwu/components';
import { RwDataService } from '../data/data.service';
import { RW_CORE_SETTINGS } from '../settings-token';
import { AttachmentComponent } from './attachment.component';

describe('AttachmentComponent', () => {
  let fixture: ComponentFixture<AttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwDataService, useValue: {} },
        { provide: RwToastService, useValue: {} },
        { provide: RW_CORE_SETTINGS, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachmentComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
