import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import {
  RwMentionsProviderService,
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { RwMessageService } from '../message.service';
import { MessageInputComponent } from './input.component';

function enterEvent(
  init: Partial<KeyboardEvent> & { key?: string } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

describe('MessageInputComponent', () => {
  let component: MessageInputComponent;
  let sendMessageSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageInputComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: StateService, useValue: {} },
        {
          provide: RwSettingsService,
          useValue: {
            user: {
              send_with_modifier_key: false,
              updated: new BehaviorSubject(undefined),
            },
          },
        },
        { provide: RwUserService, useValue: { getIsExternal: () => false } },
        {
          provide: RwMessageService,
          useValue: {
            connected: new BehaviorSubject(true),
            mention: false,
            getTempMessage: () => '',
            setTempMessage: () => undefined,
            clearTempMessage: () => undefined,
          },
        },
        {
          provide: RwMentionsProviderService,
          useValue: {
            getUser: () => ({}),
            getIssue: () => ({}),
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

    const fixture = TestBed.createComponent(MessageInputComponent);
    component = fixture.componentInstance;
    sendMessageSpy = jest.spyOn(component, 'sendMessage').mockImplementation();
  });

  it('compiles', () => {
    expect(component).toBeTruthy();
  });

  describe('trySendOnEnter', () => {
    it('sends on Enter when sendWithModifier is false', () => {
      component.sendWithModifier = false;
      expect(component.trySendOnEnter(enterEvent())).toBe(true);
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('does not send on Mod+Enter when sendWithModifier is false', () => {
      component.sendWithModifier = false;
      expect(component.trySendOnEnter(enterEvent({ metaKey: true }))).toBe(
        false,
      );
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('sends on Meta+Enter when sendWithModifier is true', () => {
      component.sendWithModifier = true;
      expect(component.trySendOnEnter(enterEvent({ metaKey: true }))).toBe(
        true,
      );
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('sends on Alt+Enter when sendWithModifier is true', () => {
      component.sendWithModifier = true;
      expect(component.trySendOnEnter(enterEvent({ altKey: true }))).toBe(
        true,
      );
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('sends on Ctrl+Enter when sendWithModifier is true', () => {
      component.sendWithModifier = true;
      expect(component.trySendOnEnter(enterEvent({ ctrlKey: true }))).toBe(
        true,
      );
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('does not send on plain Enter when sendWithModifier is true', () => {
      component.sendWithModifier = true;
      expect(component.trySendOnEnter(enterEvent())).toBe(false);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('does not send while mention autocomplete is open', () => {
      component.sendWithModifier = false;
      component.messageService.mention = true;
      expect(component.trySendOnEnter(enterEvent())).toBe(false);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });
  });
});
