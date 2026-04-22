import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwContainerService } from '../../../container/container.service';
import { IconWarningComponent } from './icon-warning.component';

describe('IconWarningComponent', () => {
  let fixture: ComponentFixture<IconWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconWarningComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwContainerService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IconWarningComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
