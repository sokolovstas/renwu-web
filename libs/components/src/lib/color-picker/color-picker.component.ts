import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Input,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Color } from '@renwu/utils';
import { RwDropDownComponent } from '../dropdown/dropdown.component';
import { RwIconComponent } from '../icon/icon.component';
import { RwTextInputComponent } from '../text-input/text-input.component';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-color-picker',
  standalone: true,
  imports: [
    RwDropDownComponent,
    RwTextInputComponent,
    RwIconComponent,
    FormsModule,
  ],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwColorPickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwColorPickerComponent implements ControlValueAccessor {
  private cd = inject(ChangeDetectorRef);

  @ViewChild('dropdown', { static: true })
  dropdown: RwDropDownComponent;

  @Input()
  @HostBinding('class.required')
  required: boolean;

  displayHex = '#000000';
  textValue = '#000000';
  colors: Color[][];
  baseColors: Color[];
  opened = false;

  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: string) => void = noop;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.opened) {
      this.closePopup();
    }
  }

  constructor() {
    this.baseColors = [
      '#e3635a',
      '#f6976d',
      '#faba64',
      '#d5ce26',
      '#8cc63e',
      '#38b449',
      '#54bfa1',
      '#47c5e2',
      '#1997c9',
      '#0179b5',
      '#4662a4',
      '#8463a5',
      '#da70ac',
      '#d46481',
      '#ef4957',
      '#555d69',
    ].map((hex) => new Color(hex));

    this.colors = [];

    const hueCount = 15;
    const hueStep = 1 / hueCount;
    const lightnessCount = 6;
    const lightnessMin = 0.2;
    const lightnessMax = 0.9;
    const lightnessStep = (lightnessMax - lightnessMin) / lightnessCount;
    const saturation = 0.8;

    for (
      let l = lightnessMin;
      l <= lightnessMax - lightnessStep;
      l += lightnessStep
    ) {
      const line: Color[] = [];
      for (let h = 0; h <= 1 - hueStep; h += hueStep) {
        const c = new Color('');
        c.saturation = saturation;
        c.lightness = l;
        c.hue = h;
        c.hslToRgb();
        line.push(c);
      }
      const cb = new Color('');
      cb.saturation = 0;
      cb.lightness = l;
      cb.hue = 0;
      cb.hslToRgb();
      line.push(cb);
      this.colors.unshift(line);
    }
  }

  writeValue(value: string): void {
    this.applyColor(value || '#000000', false);
  }

  registerOnChange(fn: (_: string) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  openPopup(): void {
    this.dropdown.show();
    this.opened = true;
    this.cd.markForCheck();
  }

  closePopup(): void {
    this.opened = false;
    this.dropdown.hide();
    this.cd.markForCheck();
  }

  selectColor(swatch: Color, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.applyColor(swatch.getHex(), true);
    this.closePopup();
  }

  parseColor(value: string): void {
    this.applyColor(value || '#000000', true);
    this.closePopup();
  }

  private applyColor(hex: string, emit: boolean): void {
    this.displayHex = new Color(hex).getHex();
    this.textValue = this.displayHex;
    if (emit) {
      this.onChangeCallback(this.displayHex);
      this.onTouchedCallback();
    }
    this.cd.detectChanges();
  }
}
