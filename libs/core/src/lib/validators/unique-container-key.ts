import { Injectable } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ValidationErrors,
} from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { RwDataService } from '../data/data.service';

@Injectable({ providedIn: 'root' })
export class UniqueContainerKeyValidator implements AsyncValidator {
  constructor(private dataService: RwDataService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const id = control.get('id');
    const key = control.get('key');
    return this.dataService.testUniqueContainerKey(key?.value, id?.value).pipe(
      map((unique) => {
        const errors = unique ? null : { uniqueContainerKey: true };
        key.setErrors(errors);
        return errors;
      }),
      catchError(() => of(null)),
    );
  }
}
