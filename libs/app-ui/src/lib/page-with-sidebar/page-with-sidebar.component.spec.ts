import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageWithSidebarComponent } from './page-with-sidebar.component';

describe('RenwuPageWithSidebarComponent', () => {
  let component: RenwuPageWithSidebarComponent;
  let fixture: ComponentFixture<RenwuPageWithSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenwuPageWithSidebarComponent, TranslocoPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(RenwuPageWithSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
