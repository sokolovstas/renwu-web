import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import {
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { RwMessageService } from '../message.service';
import { MessageInputComponent } from './input.component';

describe('MessageInputComponent', () => {
  it('compiles', async () => {
    await TestBed.configureTestingModule({
      imports: [MessageInputComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: StateService, useValue: {} },
        { provide: RwSettingsService, useValue: { user: {} } },
        { provide: RwUserService, useValue: {} },
        {
          provide: RwMessageService,
          useValue: {
            connected: new BehaviorSubject(true),
          },
        },
        {
          provide: TranslocoService,
          useValue: {
            translate: (k: string) => k,
            selectTranslate: () => of(''),
          },
        },
      ],
    }).compileComponents();
    expect(true).toBe(true);
  });
});
