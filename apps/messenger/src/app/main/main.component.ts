import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  RenwuPageComponent,
  RenwuPageWithSidebarComponent,
  RenwuSidebarService,
} from '@renwu/app-ui';
import {
  DestinationComponent,
  DestinationsComponent,
  MessageDestination,
  MessageInputComponent,
  MessageSubDestinationsComponent,
  MessageThreadComponent,
  RwMessageService,
} from '@renwu/messaging';
import { filterFalsy } from '@renwu/utils';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'renwu-messenger-main',
  standalone: true,
  imports: [
    RenwuPageComponent,
    RenwuPageWithSidebarComponent,
    DestinationsComponent,
    MessageThreadComponent,
    MessageSubDestinationsComponent,
    MessageInputComponent,
    DestinationComponent,
    AsyncPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainComponent {
  messageService = inject(RwMessageService);
  sidebarService = inject(RenwuSidebarService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  destinationParam = this.route.paramMap.pipe(
    map((m) => m.get('destinationId')),
    filterFalsy(),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  destination = this.destinationParam.pipe(
    map((m) => m.split(':')[0]),
    switchMap((id) => (id ? this.messageService.getDestination(id) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  subDestination = this.destinationParam.pipe(
    map((m) => m.split(':')[1]),
    switchMap((id) => (id ? this.messageService.getDestination(id) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  thread = combineLatest([
    this.destination.pipe(startWith(null)),
    this.subDestination.pipe(startWith(null)),
  ]).pipe(map(([did, tid]) => tid || did));
  selectDestination(destination: MessageDestination) {
    this.router.navigate(['../', destination.id], {
      relativeTo: this.route,
    });
    this.sidebarService.scrollToMain();
  }
  selectSubDestination(destination: MessageDestination) {
    if (destination.rootDestination?.id) {
      this.router.navigate(
        ['../', `${destination.rootDestination.id}:${destination.id}`],
        {
          relativeTo: this.route,
        },
      );
    } else {
      this.router.navigate(['../', `${destination.id}`], {
        relativeTo: this.route,
      });
    }
  }
}
