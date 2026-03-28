import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Split of the period that contains "now": elapsed vs remaining time window. */
export interface WorkloadBarSplit {
  leftWidth: number;
  rightWidth: number;
  leftRatio: number;
  rightRatio: number;
  /** Rounded integers for display (value / capacity per side) */
  leftNum: number;
  leftDen: number;
  rightNum: number;
  rightDen: number;
}

export interface WorkloadBar {
  position: number;
  width: number;
  /** Period capacity (e.g. hours), API `total` */
  total: number;
  /** Kept for compatibility; same as total for workload */
  capacity: number;
  /** Single-segment fill ratio (non-current periods) */
  ratio: number;
  split?: WorkloadBarSplit;
  /** value_from_now + value_to_now for single-bar label */
  assignedSum?: number;
}

@Component({
  selector: 'renwu-timeline-workload-user-item',
  standalone: true,
  templateUrl: './workload-user-item.component.html',
  styleUrl: './workload-user-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadUserItemComponent {
  @Input() bar!: WorkloadBar;

  /** Always integer pair for template (defensive vs raw API decimals in `bar`). */
  get splitLeftText(): string {
    const s = this.bar?.split;
    if (!s) return '';
    return WorkloadUserItemComponent.pairInt(s.leftNum, s.leftDen);
  }

  get splitRightText(): string {
    const s = this.bar?.split;
    if (!s) return '';
    return WorkloadUserItemComponent.pairInt(s.rightNum, s.rightDen);
  }

  private static pairInt(a: unknown, b: unknown): string {
    const x = WorkloadUserItemComponent.toInt(a);
    const y = WorkloadUserItemComponent.toInt(b);
    return `${x}/${y}`;
  }

  private static toInt(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  segmentClass(ratio: number): string {
    if (ratio > 1) return 'bar-overload';
    if (ratio > 0.8) return 'bar-high';
    if (ratio > 0.5) return 'bar-medium';
    if (ratio > 0) return 'bar-low';
    return 'bar-empty';
  }

  get barColorClass(): string {
    if (!this.bar) return 'bar-empty';
    if (this.bar.split) {
      const r = Math.max(this.bar.split.leftRatio, this.bar.split.rightRatio);
      return this.segmentClass(r);
    }
    return this.segmentClass(this.bar.ratio);
  }

  get label(): string {
    if (!this.bar) return '';
    if (this.bar.split) {
      const s = this.bar.split;
      return `${WorkloadUserItemComponent.pairInt(s.leftNum, s.leftDen)} · ${WorkloadUserItemComponent.pairInt(s.rightNum, s.rightDen)}`;
    }
    const sum = this.bar.assignedSum ?? this.bar.ratio * this.bar.total;
    const a = WorkloadUserItemComponent.roundNum(sum);
    const t = WorkloadUserItemComponent.roundNum(this.bar.total);
    return `${a}/${t}`;
  }

  private static roundNum(n: unknown): number {
    const x = typeof n === 'number' && !Number.isNaN(n) ? n : Number(n);
    return Number.isFinite(x) ? Math.round(x) : 0;
  }
}
