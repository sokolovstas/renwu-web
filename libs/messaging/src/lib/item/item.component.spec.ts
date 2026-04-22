import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { RwAlertService, RwToastService } from '@renwu/components';
import {
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { RwMessageService } from '../message.service';
import { MessageItemComponent } from './item.component';

describe('MessageItemComponent', () => {
  it('compiles', async () => {
    await TestBed.configureTestingModule({
      imports: [MessageItemComponent],
      providers: [
        { provide: RwAlertService, useValue: {} },
        { provide: RwToastService, useValue: {} },
        {
          provide: RwMessageService,
          useValue: {
            connected: new BehaviorSubject(true),
            getDestination: () => of(null),
          },
        },
        { provide: StateService, useValue: {} },
        {
          provide: DomSanitizer,
          useValue: { bypassSecurityTrustHtml: (h: string) => h },
        },
        { provide: RwSettingsService, useValue: { user: {} } },
        { provide: RwUserService, useValue: { getId: () => '' } },
      ],
    }).compileComponents();
    expect(true).toBe(true);
  });
});
