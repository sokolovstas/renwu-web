import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TourHintComponent } from './tour-hint.component';

describe('TourHintComponent', () => {
  let component: TourHintComponent;
  let fixture: ComponentFixture<TourHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourHintComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TourHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
