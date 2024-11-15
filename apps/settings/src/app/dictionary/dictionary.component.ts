import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwColorPickerComponent,
  RwIconComponent,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
  RwSortTableRowHandlerDirective,
  RwTextInputComponent,
  RwToastService,
  SortCompletedEvent,
} from '@renwu/components';
import { Priority, Resolution, RwDataService, Status, Type } from '@renwu/core';
import { firstValueFrom, map, shareReplay, switchMap, tap } from 'rxjs';

@Component({
  selector: 'renwu-settings-dictionary',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwTextInputComponent,
    RenwuPageComponent,
    RwIconComponent,
    RwCheckboxComponent,
    RwColorPickerComponent,
    RwSortTableColumnDirective,
    RwSortTableRowHandlerDirective,
    RwSortTableColumnHeadDirective,
    RwSortTableRowDirective,
    RwSortTableDirective,
    RwButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './dictionary.component.html',
  styleUrl: './dictionary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictionaryComponent {
  cd = inject(ChangeDetectorRef);
  route = inject(ActivatedRoute);
  toastService = inject(RwToastService);
  dataService = inject(RwDataService);
  transloco = inject(TranslocoService);

  dictionaryName = this.route.paramMap.pipe(
    map((p) => p.get('name')),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );
  dictionary = this.dictionaryName.pipe(
    switchMap((n) =>
      this.dataService.getDictionary<Priority | Type | Status | Resolution>(
        `dictionary/${n}`,
      ),
    ),
    tap((d) => {
      this.dictionaryForm.controls.data.clear();
      d.forEach((d) => {
        this.dictionaryForm.controls.data.push(
          new FormGroup({
            id: new FormControl(d.id),
            sort: new FormControl(d.sort),
            label: new FormControl(d.label),
            color: new FormControl(d.color),
            symbol: new FormControl(d.symbol),
            default: new FormControl(d.default),
            closed: new FormControl((d as Status).closed),
            completed: new FormControl((d as Status).completed),
            log_time: new FormControl((d as Status).log_time),
            in_progress: new FormControl((d as Status).in_progress),
            account_time: new FormControl((d as Status).account_time),
            rebot: new FormControl((d as Status).rebot),
          }),
        );
      });
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );
  dictionaryForm = new FormGroup({
    data: new FormArray([
      new FormGroup({
        id: new FormControl(''),
        sort: new FormControl(0),
        label: new FormControl(''),
        color: new FormControl(''),
        symbol: new FormControl(''),
        default: new FormControl(false),
        closed: new FormControl(false),
        completed: new FormControl(false),
        log_time: new FormControl(false),
        in_progress: new FormControl(false),
        account_time: new FormControl(false),
        rebot: new FormControl(false),
      }),
    ]),
  });
  sortCompleted(event: SortCompletedEvent) {
    const old = this.dictionaryForm.controls.data.at(event.oldIndex);
    this.dictionaryForm.controls.data.removeAt(event.oldIndex);
    this.dictionaryForm.controls.data.insert(event.newIndex, old);
  }
  async save() {
    const name = await firstValueFrom(this.dictionaryName);

    // set sort from index
    const dict = this.dictionaryForm.value.data;
    dict.forEach((v, i) => (v.sort = i));

    await firstValueFrom(
      this.dataService.saveDictionary(`dictionary/${name}`, dict),
    );

    this.toastService.success(
      this.transloco.translate('settings.saved-%name%', { name }),
    );
  }
  getDictionaryTitle(name: string) {
    /**
     * t(settings.dictionary-status)
     * t(settings.dictionary-priority)
     * t(settings.dictionary-resolution)
     * t(settings.dictionary-type)
     */
    const locale = this.transloco.translate(`settings.dictionary-${name}`);
    return locale;
  }
  removeItem(index: number) {
    this.dictionaryForm.controls.data.removeAt(index);
  }
  addItem() {
    this.dictionaryForm.controls.data.insert(
      Number.MAX_VALUE,
      new FormGroup({
        id: new FormControl(''),
        sort: new FormControl(Number.MAX_SAFE_INTEGER),
        label: new FormControl('---'),
        color: new FormControl('#fff'),
        symbol: new FormControl(''),
        default: new FormControl(false),
        closed: new FormControl(false),
        completed: new FormControl(false),
        log_time: new FormControl(false),
        in_progress: new FormControl(false),
        account_time: new FormControl(false),
        rebot: new FormControl(false),
      }),
    );
  }
}
