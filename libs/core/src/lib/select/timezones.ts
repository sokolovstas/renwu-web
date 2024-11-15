import { Injectable } from '@angular/core';
import { SelectModelString } from './string';
import timezone from './timezones.json';

@Injectable()
export class SelectModelTimezone extends SelectModelString {
  constructor() {
    super(
      timezone.map((t) => ({
        id: t.text,
        label: t.text,
      })),
    );
  }
}
