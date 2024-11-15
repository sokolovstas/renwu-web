import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'renwu-tasks-tree',
  standalone: true,
  imports: [],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeComponent {}
