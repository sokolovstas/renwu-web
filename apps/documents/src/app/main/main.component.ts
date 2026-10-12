import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwDataService, RwDocument } from '@renwu/core';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-documents-main',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  private readonly data = inject(RwDataService);
  private readonly router = inject(Router);

  readonly documents$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    startWith(null),
    switchMap(() =>
      this.data.docsListDocuments().pipe(
        map((docs) => ({ error: false, docs })),
        catchError(() => of({ error: true, docs: [] as RwDocument[] })),
      ),
    ),
  );
}
