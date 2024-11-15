import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AlertButton, AlertInstance, RwAlertService } from './alert.service';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '../button/button.component';
import {
  RwShortcutService,
  ShortcutObservable,
} from '../shortcut/shortcut.service';
import { RwTextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'rw-alert',
  standalone: true,
  imports: [
    RwButtonComponent,
    RwTextInputComponent,
    FormsModule,
    TranslocoPipe
],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  animations: [
    trigger('state', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(0) scale(0.95)',
        }),
      ),
      state(
        'show',
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        }),
      ),
      transition('void => show', animate('200ms 100ms ease-out')),
      transition('show => void', animate('200ms ease-out')),
    ]),
    trigger('backgroundState', [
      state(
        'void',
        style({
          opacity: 0,
        }),
      ),
      state(
        'show',
        style({
          opacity: 1,
        }),
      ),
      transition('void => show', animate('200ms ease-out')),
      transition('show => void', animate('200ms 100ms ease-out')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwAlertComponent implements OnInit, OnDestroy {
  shortcutESC: ShortcutObservable;

  shortcutEnter: ShortcutObservable;

  @Input()
  alert: AlertInstance;

  constructor(
    public alertService: RwAlertService,
    private shortcutService: RwShortcutService,
    private cd: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.shortcutESC = this.shortcutService.subscribe('Escape', () => {
      for (let i = 0; i < this.alert.buttons.length; ++i) {
        const button = this.alert.buttons[i];
        if (!button.affirmative) {
          this.alertService.result.next(button);
          this.alertService.result.complete();
          break;
        }
      }
      this.alertService.close();
      this.cd.detectChanges();
    });
    this.shortcutEnter = this.shortcutService.subscribe('Enter', () => {
      for (let i = 0; i < this.alert.buttons.length; ++i) {
        const button = this.alert.buttons[i];
        if (button.affirmative) {
          this.alertService.result.next(button);
          this.alertService.result.complete();
          this.alertService.close();
          return;
        }
      }
    });
  }
  ngOnDestroy(): void {
    this.alertService = null;
    this.shortcutService = null;
    this.shortcutESC.unsubscribe();
    this.shortcutEnter.unsubscribe();
  }
  onClickAlertButton(button: AlertButton): void {
    this.alertService.result.next(button);
    this.alertService.result.complete();
    this.alertService.close();
  }
  closeAlertByClick(): void {
    if (this.alert.closeByClickBackground) {
      if (this.alert.buttons && this.alert.clickByBackgroundIsNo) {
        for (let i = 0; i < this.alert.buttons.length; ++i) {
          const button = this.alert.buttons[i];
          if (!button.affirmative) {
            this.alertService.result.next(button);
            this.alertService.result.complete();
            break;
          }
        }
      }
      this.alertService.close();
    }
  }
}
