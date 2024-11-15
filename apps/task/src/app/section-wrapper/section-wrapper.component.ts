import {
  Component,
  ElementRef,
  Injector,
  Input,
  OnInit,
  inject,
} from '@angular/core';

@Component({
  selector: 'renwu-task-section-wrapper',
  standalone: true,
  templateUrl: './section-wrapper.component.html',
  styleUrl: './section-wrapper.component.css',
})
export class SectionWrapperComponent implements OnInit {
  el = inject(ElementRef);
  injector = inject(Injector);

  @Input()
  section: { element: string };
  ngOnInit(): void {
    const element = document.createElement(
      this.section.element,
    ) as HTMLElement & { injector: Injector };
    element.injector = this.injector;
    (this.el.nativeElement as HTMLElement).appendChild(element);
  }
}
