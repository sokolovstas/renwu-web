import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { TimelineLink } from '../models/timeline-issue.model';
import {
  timelineIssueBarEnd,
  timelineIssueBarStart,
} from './timeline-bar-dates';
import { unixSecondsVirtual } from '../virtual-hours';

const ELBOW_STUB_PX = 8;
/** Min horizontal gap (px) for a plain stub → vertical → horizontal connector. */
const MIN_NORMAL_GAP_PX = ELBOW_STUB_PX + 8;
/** Symmetric horizontal offset on S/Z detours (right exit and left approach). */
const DETOUR_GAP_PX = 8;
const LINK_Z_INDEX = 5;
const LINK_Z_INDEX_ACTIVE = 12;

@Component({
  selector: 'renwu-timeline-link',
  standalone: true,
  templateUrl: './timeline-link.component.html',
  styleUrl: './timeline-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineLinkComponent implements OnChanges {
  @Input() data!: TimelineLink;
  @Input() issueRowIndex = -1;
  @Input() linkRowIndex = -1;
  @Input() issueRowHeightPx = 37;
  @Input() roadmapBandHeightPx = 0;
  @Input() dateStart!: Date;
  @Input() hours24InDay = true;
  @Input() scale = 1;
  @Input() highlighted = false;

  @Output() linkHover = new EventEmitter<boolean>();

  @HostBinding('style.position') protected readonly hostPosition = 'absolute';
  @HostBinding('style.z-index')
  protected get hostZIndex(): number {
    return this.highlighted ? LINK_Z_INDEX_ACTIVE : LINK_Z_INDEX;
  }
  @HostBinding('style.pointer-events') protected readonly hostPointerEvents = 'none';
  @HostBinding('style.left.px') protected hostLeft = 0;
  @HostBinding('style.top.px') protected hostTop = 0;
  @HostBinding('style.width.px') protected hostWidth = 0;
  @HostBinding('style.height.px') protected hostHeight = 0;

  protected visible = false;
  protected boxLeft = 0;
  protected boxTop = 0;
  protected boxWidth = 0;
  protected boxHeight = 0;
  protected pathD = '';
  protected markerId = 'timeline-link-arrow';

  ngOnChanges(): void {
    this.visible = false;
    this.pathD = '';
    this.markerId = 'timeline-link-arrow';

    if (
      !this.data ||
      !this.dateStart ||
      !this.scale ||
      this.issueRowIndex < 0 ||
      this.linkRowIndex < 0
    ) {
      return;
    }

    const issueId = this.data.issue?.id ?? 'issue';
    const linkId = this.data.link?.id ?? 'link';
    this.markerId = `timeline-link-arrow-${issueId}-${linkId}-${this.data.type}`;

    const endpoints = this.resolveEndpoints();
    if (!endpoints) return;

    const { xStart, xEnd, yStart, yEnd } = endpoints;

    const pathPoints = this.buildPathPoints(xStart, xEnd, yStart, yEnd);
    if (!pathPoints.length) return;

    const xs = pathPoints.map((p) => p.x);
    const ys = pathPoints.map((p) => p.y);
    const pad = 6;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad;

    this.boxLeft = minX;
    this.boxTop = minY;
    this.boxWidth = Math.max(1, maxX - minX);
    this.boxHeight = Math.max(1, maxY - minY);
    this.hostLeft = this.boxLeft;
    this.hostTop = this.boxTop;
    this.hostWidth = this.boxWidth;
    this.hostHeight = this.boxHeight;
    this.pathD = pathPoints
      .map((p, i) => {
        const x = p.x - minX;
        const y = p.y - minY;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    this.visible = true;
  }

  private resolveEndpoints(): {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  } | null {
    const issue = this.data.issue;
    const linked = this.data.link;

    let fromDate: Date | null;
    let fromEdge: 'start' | 'end';
    let toDate: Date | null;
    let toEdge: 'start' | 'end';

    if (this.data.type === 'after') {
      // prev_issue → current: prev ends, then current starts
      fromDate = timelineIssueBarEnd(linked);
      fromEdge = 'end';
      toDate = timelineIssueBarStart(issue);
      toEdge = 'start';
    } else {
      // current → next_issue: current ends, then next starts
      fromDate = timelineIssueBarEnd(issue);
      fromEdge = 'end';
      toDate = timelineIssueBarStart(linked);
      toEdge = 'start';
    }

    if (!fromDate || !toDate) return null;

    const xStart = this.dateToPx(fromDate, fromEdge);
    const xEnd = this.dateToPx(toDate, toEdge);

    let yStart: number;
    let yEnd: number;
    if (this.data.type === 'after') {
      yStart = this.rowCenterY(this.linkRowIndex);
      yEnd = this.rowCenterY(this.issueRowIndex);
    } else {
      yStart = this.rowCenterY(this.issueRowIndex);
      yEnd = this.rowCenterY(this.linkRowIndex);
    }

    return { xStart, xEnd, yStart, yEnd };
  }

  private buildPathPoints(
    xStart: number,
    xEnd: number,
    yStart: number,
    yEnd: number,
  ): Array<{ x: number; y: number }> {
    const gap = xEnd - xStart;
    const sameRow = Math.abs(yStart - yEnd) < 1;

    if (this.needsDetourPath(gap)) {
      return sameRow
        ? this.buildTightSameRowPath(xStart, xEnd, yStart, yEnd)
        : this.buildTightSzPath(xStart, xEnd, yStart, yEnd);
    }

    if (sameRow) {
      return [
        { x: xStart, y: yStart },
        { x: xEnd, y: yEnd },
      ];
    }

    const stub = Math.min(ELBOW_STUB_PX, Math.max(4, gap / 3));
    const elbowX = xStart + stub;

    return [
      { x: xStart, y: yStart },
      { x: elbowX, y: yStart },
      { x: elbowX, y: yEnd },
      { x: xEnd, y: yEnd },
    ];
  }

  /** S/Z detour only when bars touch or leave almost no horizontal runway. */
  private needsDetourPath(gap: number): boolean {
    return gap < MIN_NORMAL_GAP_PX;
  }

  /**
   * Symmetric S/Z: right G → down D → left G → down D → right to target.
   * Both vertical segments share the same length; horizontal gaps match.
   */
  private buildTightSzPath(
    xStart: number,
    xEnd: number,
    yStart: number,
    yEnd: number,
  ): Array<{ x: number; y: number }> {
    const g = DETOUR_GAP_PX;
    const drop = Math.abs(yEnd - yStart) / 2;
    const goingDown = yEnd >= yStart;
    const yMid = goingDown ? yStart + drop : yStart - drop;

    const anchor = Math.min(xStart, xEnd);
    const xRight = xStart + g;
    const xLeft = anchor - g;
    const xApproach = xEnd - g;

    return [
      { x: xStart, y: yStart },
      { x: xRight, y: yStart },
      { x: xRight, y: yMid },
      { x: xLeft, y: yMid },
      { x: xLeft, y: yEnd },
      { x: xApproach, y: yEnd },
      { x: xEnd, y: yEnd },
    ];
  }

  /** Tight same-row gap: symmetric detour below the bars. */
  private buildTightSameRowPath(
    xStart: number,
    xEnd: number,
    yStart: number,
    yEnd: number,
  ): Array<{ x: number; y: number }> {
    const g = DETOUR_GAP_PX;
    const drop = Math.max(10, Math.round(this.issueRowHeightPx * 0.38));
    const yDetour = yStart + drop;

    const anchor = Math.min(xStart, xEnd);
    const xRight = xStart + g;
    const xLeft = anchor - g;
    const xApproach = xEnd - g;

    return [
      { x: xStart, y: yStart },
      { x: xRight, y: yStart },
      { x: xRight, y: yDetour },
      { x: xLeft, y: yDetour },
      { x: xApproach, y: yDetour },
      { x: xApproach, y: yEnd },
      { x: xEnd, y: yEnd },
    ];
  }

  private rowCenterY(rowIndex: number): number {
    return (
      this.roadmapBandHeightPx +
      rowIndex * this.issueRowHeightPx +
      this.issueRowHeightPx / 2
    );
  }

  private dateToPx(date: Date, edge: 'start' | 'end'): number {
    const origin = unixSecondsVirtual(this.dateStart, this.hours24InDay, '');
    return (
      (unixSecondsVirtual(date, this.hours24InDay, edge) - origin) / this.scale
    );
  }

  protected onPathHover(inside: boolean): void {
    this.linkHover.emit(inside);
  }
}
