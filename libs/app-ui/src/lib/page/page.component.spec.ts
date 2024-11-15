import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from './page.component';

describe('PageComponent', () => {
  let component: RenwuPageComponent;
  let fixture: ComponentFixture<RenwuPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenwuPageComponent, TranslocoPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RenwuPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
