import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RenwuSidebarService, RenwuTourService } from '@renwu/app-ui';
import {
  RwAlertService,
  RwModalService,
  RwTooltipService,
} from '@renwu/components';
import { RwLoaderService, RwTitleService, StateService } from '@renwu/core';
import { filter, map } from 'rxjs';
import { CheckForUpdateService } from './sw-check.service';

@Component({
  selector: 'renwu-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  protected stateService = inject(StateService);
  protected sidebarService = inject(RenwuSidebarService);
  protected router = inject(Router);
  protected title = inject(RwTitleService);
  protected loaderService = inject(RwLoaderService);
  protected modalService = inject(RwModalService);
  protected alertService = inject(RwAlertService);
  protected tooltipService = inject(RwTooltipService);

  @ViewChild('scrollContainer', { read: ElementRef })
  scrollContainer: ElementRef;

  dontHaveSidebar = this.router.events.pipe(
    filter((e) => e instanceof NavigationEnd),
    map(
      (e) =>
        (e as NavigationEnd).url === '/' ||
        (e as NavigationEnd).url.includes('/(section'),
    ),
  );
  mainRouteExist = this.router.events.pipe(
    filter((e) => e instanceof NavigationEnd),
    map((e) => (e as NavigationEnd).url.includes('section:task')),
  );
  checkUpdate = inject(CheckForUpdateService);
  tour = inject(RenwuTourService);

  async ngAfterViewInit(): Promise<void> {
    this.sidebarService.init(this.scrollContainer);
  }
}
