import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService, RenwuTourService } from '@renwu/app-ui';
import {
  RwAlertService,
  RwModalService,
  RwTooltipService,
} from '@renwu/components';
import { RwLoaderService, RwTitleService, StateService } from '@renwu/core';
import { AppComponent } from './app.component';
import { CheckForUpdateService } from './sw-check.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: StateService, useValue: {} },
        { provide: RenwuSidebarService, useValue: { init: () => undefined } },
        { provide: RwTitleService, useValue: {} },
        { provide: RwLoaderService, useValue: {} },
        { provide: RwModalService, useValue: {} },
        { provide: RwAlertService, useValue: {} },
        { provide: RwTooltipService, useValue: {} },
        { provide: CheckForUpdateService, useValue: {} },
        { provide: RenwuTourService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
