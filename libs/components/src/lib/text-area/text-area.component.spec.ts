import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwTextAreaComponent } from './text-area.component';

describe('RwTextAreaComponent', () => {
  let fixture: ComponentFixture<RwTextAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RwTextAreaComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTextAreaComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
