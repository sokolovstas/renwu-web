import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RwIconComponent } from '@renwu/components';
import { RenwuSidebarService } from '../sidebar.service';

@Component({
  selector: 'renwu-page',
  standalone: true,
  imports: [RouterLink, RwIconComponent, NgClass],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RenwuPageComponent {
  sidebarService = inject(RenwuSidebarService);
  @Input()
  title: string;

  @Input()
  breadcrumbs: { title: string; url?: string; showSidebar?: boolean }[];

  @Input()
  hideTitle: boolean;

  @Input()
  fixedHeader: boolean;

  @Input()
  noPadding: boolean;
  action(b: { title: string; url?: string; showSidebar?: boolean }) {
    if (b?.showSidebar) {
      this.sidebarService.scrollToSidebar();
    }
  }
}
