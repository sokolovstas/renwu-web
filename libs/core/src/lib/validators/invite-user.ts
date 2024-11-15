import { Injectable } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ValidationErrors,
} from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { RwDataService } from '../data/data.service';

@Injectable({ providedIn: 'root' })
export class CheckUserValidator implements AsyncValidator {
  constructor(private dataService: RwDataService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const id = control.get('id');
    const username = control.get('username');
    const email = control.get('email');
    return this.dataService
      .checkUser({
        id: id?.value,
        username: username?.value,
        email: email?.value,
      })
      .pipe(
        map((response) => {
          switch (true) {
            case response.result.toLowerCase().includes('username'):
              username.setErrors({ username: response.result });
              return { username: response.result };
            case response.result.toLowerCase().includes('email'):
              email.setErrors({ username: response.result });
              return { email: response.result };
            case response.result.toLowerCase().includes('OK'):
              return null;
          }
          return null;
        }),
        catchError(() => of(null)),
      );
  }
}
