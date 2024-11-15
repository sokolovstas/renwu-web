import {
  DestroyRef,
  Directive,
  ElementRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Placement } from '@floating-ui/dom';
import { fromEvent } from 'rxjs';
import { RwDropDownComponent } from './dropdown.component';

@Directive({
  selector: '[rwDropdown]',
  standalone: true,
})
export class RwDropDownDirective implements OnInit {
  element = inject(ElementRef);
  destroy = inject(DestroyRef);

  @Input()
  rwDropdown: RwDropDownComponent;
  @Input()
  rwDropdownTrigger: 'click' | 'mouseover';
  @Input()
  rwDropdownHideOnClickOutside: boolean;
  @Input()
  rwDropdownPlacement: Placement;

  ngOnInit() {
    fromEvent(this.element.nativeElement, this.rwDropdownTrigger)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.rwDropdown.bindElement = this.element.nativeElement;
        this.rwDropdown.openDropdown();
      });
    if (this.rwDropdownHideOnClickOutside) {
      fromEvent(window, 'click')
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe(() => {
          this.rwDropdown.closeDropdown();
        });
    }
  }
}
