import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageComponent } from './page.component';

describe('PageComponent', () => {
  let component: RwPageComponent;
  let fixture: ComponentFixture<RwPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RwPageComponent, TranslocoPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RwPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
