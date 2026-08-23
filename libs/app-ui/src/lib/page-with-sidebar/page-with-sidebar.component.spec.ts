import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageWithSidebarComponent } from './page-with-sidebar.component';

describe('RwPageWithSidebarComponent', () => {
  let component: RwPageWithSidebarComponent;
  let fixture: ComponentFixture<RwPageWithSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RwPageWithSidebarComponent, TranslocoPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RwPageWithSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
