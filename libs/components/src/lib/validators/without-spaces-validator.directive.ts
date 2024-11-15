import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector:
    '[rwValidateWithOutSpaces][formControlName],[rwValidateWithOutSpaces][formControl],[rwValidateWithOutSpaces][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => RwWithOutSpacesValidatorDirective),
      multi: true,
    },
  ],
  standalone: true,
})
export class RwWithOutSpacesValidatorDirective implements Validator {
  constructor(
    @Attribute('validateWithOutSpaces') public validateWithOutSpaces: string,
  ) {}

  validate(c: AbstractControl): { [key: string]: boolean } {
    // self value
    const v = String(c.value);

    if (v && v.trim().length === 0) {
      return {
        validateWithoutSpaces: false,
      };
    }

    return null;
  }
}
