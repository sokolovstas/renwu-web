import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Issue } from '@renwu/core';
import { ITaskCard, RW_BOARD_SETTINGS } from '../board.settings';

@Component({
  selector: 'renwu-boards-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements ITaskCard, AfterViewInit {
  @Input()
  issue: Issue;

  @Input()
  type: string;

  private settings = inject(RW_BOARD_SETTINGS);
  private viewContainerRef = inject(ViewContainerRef);
  private cd = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    if (this.settings.components[this.type]) {
      this.viewContainerRef.element.nativeElement.replaceChildren();
      const ref = this.viewContainerRef.createComponent(
        this.settings.components[this.type],
      );
      ref.instance.issue = this.issue;
      return;
    }
    if (this.settings.components['default']) {
      this.viewContainerRef.element.nativeElement.replaceChildren();
      const ref = this.viewContainerRef.createComponent(
        this.settings.components['default'],
      );
      ref.instance.issue = this.issue;
      return;
    }
  }
}
