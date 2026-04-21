import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskSectionConfig } from '../task-sections/task-section.model';
import { SectionWrapperComponent } from './section-wrapper.component';

describe('SectionWrapperComponent', () => {
  let component: SectionWrapperComponent;
  let fixture: ComponentFixture<SectionWrapperComponent>;

  const section: TaskSectionConfig = { element: 'div' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionWrapperComponent);
    component = fixture.componentInstance;
    component.section = section;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
