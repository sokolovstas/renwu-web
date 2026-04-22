import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RwTextInputComponent } from './text-input.component';

describe('RwTextInputComponent', () => {
  let component: RwTextInputComponent;
  let fixture: ComponentFixture<RwTextInputComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [FormsModule, RwTextInputComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it(`should set value 'works'`, async(() => {
  //   component.writeValue('works');
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('.rw-text-input-container').getAttribute('value')).toContain('works');
  // }));
});
