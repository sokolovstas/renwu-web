import { AsyncPipe, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  RwButtonComponent,
  RwIconComponent,
  RwTextAreaComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
} from '@renwu/components';
import { IssueStatusComponent } from '@renwu/core';

@Component({
  selector: 'renwu-todos-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwTextAreaComponent,
    RwTextInputComponent,
    RwTimePickerComponent,
    IssueStatusComponent,
    RwIconComponent,
    RwButtonComponent,
    NgStyle
],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent {}
