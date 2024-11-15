/* tslint:disable */
import { Component, forwardRef, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RwButtonComponent } from '../button/button.component';
import { RwSelectComponent } from '../select/select.component';
import { RwTextInputComponent } from '../text-input/text-input.component';

export const SELECT_GROUP_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectGroupComponent),
  multi: true,
};

@Component({
  selector: 'rw-select-old-group',
  standalone: true,
  imports: [RwButtonComponent, RwTextInputComponent, FormsModule],
  templateUrl: './select-group.component.html',
  styleUrl: './select-group.component.scss',
  providers: [SELECT_GROUP_VALUE_ACCESSOR],
})
export class SelectGroupComponent extends RwSelectComponent implements OnInit {
  ngOnInit() {
    // this.offlineFilter = true;
    // this.many = true;
    this.tags = true;
    this.live = true;
    // this.removeAddedInOptions = false;
    // this.model.updateSearch();
  }
  onEnter() {
    return;
  }
}
