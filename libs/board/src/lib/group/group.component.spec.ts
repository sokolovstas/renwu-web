import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RwSettingsService } from '@renwu/core';
import { BoardGroupComponent } from './group.component';

describe('BoardGroupComponent', () => {
  let fixture: ComponentFixture<BoardGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardGroupComponent],
      providers: [{ provide: RwSettingsService, useValue: { user: {} } }],
    })
      .overrideComponent(BoardGroupComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BoardGroupComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
