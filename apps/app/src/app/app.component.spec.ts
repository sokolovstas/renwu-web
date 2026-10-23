import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RwSidebarService, RwTourService } from '@renwu/app-ui';
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
        {
          provide: RwSidebarService,
          useValue: { init: () => undefined, currentSection: of(null) },
        },
        { provide: RwTitleService, useValue: {} },
        { provide: RwLoaderService, useValue: {} },
        { provide: RwModalService, useValue: {} },
        { provide: RwAlertService, useValue: {} },
        { provide: RwTooltipService, useValue: {} },
        { provide: CheckForUpdateService, useValue: {} },
        { provide: RwTourService, useValue: {} },
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
