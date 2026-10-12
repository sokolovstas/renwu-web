import { NgClass } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
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
export class SectionWrapperComponent
  implements AfterViewInit, AfterViewChecked, OnDestroy
{
  el = inject(ElementRef);

  @Input({ required: true })
  section: TaskSectionConfig;

  @ViewChild('host', { read: ElementRef })
  host: ElementRef<HTMLElement>;

  private mounted = false;

  ngAfterViewInit(): void {
    this.ensureMounted();
  }

  ngAfterViewChecked(): void {
    this.ensureMounted();
  }

  ngOnDestroy(): void {
    console.info('[task-section] destroy wrapper', this.section?.element);
  }

  /**
   * The section body is a custom element appended outside the template.
   * If Angular drops that node, ngAfterViewInit does not run again and the tab stays empty.
   */
  private ensureMounted(): void {
    const host = this.host?.nativeElement;
    const tag = this.section?.element;
    if (!host || !tag) {
      console.warn('[task-section] cannot mount', { tag, hasHost: !!host });
      return;
    }
    if (host.querySelector(tag)) {
      return;
    }
    const defined = !!customElements.get(tag);
    if (this.mounted) {
      console.warn('[task-section] element disappeared, remounting', tag, {
        childCount: host.childElementCount,
        defined,
        hidden: !!host.closest('[hidden]'),
      });
    } else {
      console.info('[task-section] mount', tag, {
        defined,
        hidden: !!host.closest('[hidden]'),
      });
    }
    const element = document.createElement(tag);
    host.appendChild(element);
    this.mounted = true;
    queueMicrotask(() => {
      if (!element.isConnected) {
        console.warn('[task-section] element disconnected right after mount', tag);
        return;
      }
      const hasContent =
        element.childElementCount > 0 || element.shadowRoot != null;
      if (!customElements.get(tag) || !hasContent) {
        console.warn('[task-section] tab body is empty after mount', tag, {
          defined: !!customElements.get(tag),
          childCount: element.childElementCount,
          shadow: !!element.shadowRoot,
        });
      }
    });
  }
}
