import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { TaskSectionConfig } from '../task-sections/task-section.model';

@Component({
  selector: 'renwu-task-section-wrapper',
  standalone: true,
  imports: [NgClass],
  templateUrl: './section-wrapper.component.html',
  styleUrl: './section-wrapper.component.css',
})
export class SectionWrapperComponent implements AfterViewInit {
  el = inject(ElementRef);

  @Input({ required: true })
  section: TaskSectionConfig;

  @ViewChild('host', { read: ElementRef })
  host: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    const element = document.createElement(this.section.element);
    this.host.nativeElement.appendChild(element);
  }
}
