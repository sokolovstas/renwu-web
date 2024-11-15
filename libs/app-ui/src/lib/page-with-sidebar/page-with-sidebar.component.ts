import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'renwu-page-with-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './page-with-sidebar.component.html',
  styleUrl: './page-with-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenwuPageWithSidebarComponent {
  @Input()
  sidebarClass: string;
}
