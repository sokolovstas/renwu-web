import { readFileSync } from 'fs';
import { join } from 'path';
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
  it('uses CSS enter animation instead of the @newMessage trigger', () => {
    const html = readFileSync(join(__dirname, 'item.component.html'), 'utf8');
    expect(html).not.toMatch(/\[@newMessage]/);
    expect(html).toContain('animate.enter="rw-new-message-enter"');
  });

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
