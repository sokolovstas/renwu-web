import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { TimelineParentScopeLayout } from './parent-scope-layout';

@Component({
  selector: 'renwu-timeline-parent-scope',
  standalone: true,
  templateUrl: './timeline-parent-scope.component.html',
  styleUrl: './timeline-parent-scope.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineParentScopeComponent {
  @Input() layout!: TimelineParentScopeLayout;
  @Input() highlighted = false;

  @HostBinding('style.position') protected readonly hostPosition = 'absolute';
  @HostBinding('style.pointer-events') protected readonly hostPointerEvents = 'none';
  @HostBinding('style.left.px')
  protected get hostLeft(): number {
    return this.layout?.leftPx ?? 0;
  }
  @HostBinding('style.top.px')
  protected get hostTop(): number {
    return this.layout?.topPx ?? 0;
  }
  @HostBinding('style.width.px')
  protected get hostWidth(): number {
    return this.layout?.widthPx ?? 0;
  }
  @HostBinding('style.height.px')
  protected get hostHeight(): number {
    return this.layout?.heightPx ?? 0;
  }
  @HostBinding('style.z-index')
  protected get hostZIndex(): number {
    // Above row highlight (1), below bars (4).
    const depth = this.layout?.depth ?? 0;
    return Math.min(2 + depth, 3);
  }
}
