import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Resolution, Status } from '../../../settings/dictionary.model';

@Component({
  selector: 'renwu-issue-status',
  standalone: true,
  imports: [],
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueStatusComponent implements OnInit, AfterViewInit {
  @Input()
  set value(value: Status | Resolution) {
    if (value) {
      if (value.color && value.label) {
        this.color = value.color;
        this.label = value.label;
      }
      // if (value['color'] && value['status.label']) {
      //   this.color = value['color'];
      //   this.label = value['status.label'];
      // }
    } else {
      this.color = '';
      this.label = '';
    }
    this._value = value;
    this.calculateBounds();
  }

  get value(): Status | Resolution {
    return this._value;
  }
  _value: Status | Resolution;

  color: string;
  label: string;
  fontSizeStatus: string;
  paddingStatus: string;

  ngAfterViewInit() {
    this.calculateBounds();
  }
  ngOnInit() {
    this.calculateBounds();
  }
  calculateBounds() {
    // if (this.label) {
    //   if (this.label.length > 11) {
    //     this.fontSizeStatus = 90 - (this.label.length - 11) * 3 + '%';
    //   } else {
    //     this.fontSizeStatus = '100%';
    //   }
    // }
  }
}
