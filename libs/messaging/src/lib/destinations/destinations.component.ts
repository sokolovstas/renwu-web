import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, merge, Observable, of, Subject, switchMap } from 'rxjs';

import { AsyncPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDropDownComponent,
  RwIconComponent,
  RwTextInputComponent,
} from '@renwu/components';
import {
  RwContainerService,
  RwDataService,
  RwPolicyService,
  RwSettingsService,
  RwUserService,
  StateService,
  UserStatic,
} from '@renwu/core';
import { DestinationType, UserDestinationInfo } from '../data/messages.model';
import { DestinationComponent } from '../destination/destination.component';
import {
  FavMessageDestination,
  MessageDestination,
} from '../message-destination';
import { RwMessageService } from '../message.service';

@Component({
  selector: 'renwu-messaging-destinations',
  standalone: true,
  imports: [
    RwTextInputComponent,
    RwDropDownComponent,
    FormsModule,
    RwCheckboxComponent,
    RwButtonComponent,
    RwIconComponent,
    DestinationComponent,
    AsyncPipe,
    RouterLink,
    NgClass,
    TranslocoPipe
],
  templateUrl: './destinations.component.html',
  styleUrl: './destinations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DestinationsComponent implements OnInit {
  searchValue = '';

  userDestinations: MessageDestination[];
  userDestinationsLength: number;
  taskDestinations: MessageDestination[];
  favDestination: FavMessageDestination;
  quickSearchTaskDestinations: Observable<MessageDestination[]>;
  updateDisplayDestinationsQuickSearch = new Subject<any>();

  destroy = inject(DestroyRef);

  maxUsers = 10;
  showRecentUsers = true;

  @Output()
  selected = new EventEmitter<MessageDestination>();

  @ViewChildren(DestinationComponent)
  destinations: QueryList<DestinationComponent>;

  activeRoute = merge(
    this.route.url.pipe(map((u) => u.toString())),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).url || ''),
    ),
  );

  configScroll = {
    suppressScrollX: true,
    suppressScrollY: false,
  };

  constructor(
    private dataService: RwDataService,
    public stateService: StateService,
    public userService: RwUserService,
    public messageService: RwMessageService,
    public policyService: RwPolicyService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private containerService: RwContainerService,
    public settingsService: RwSettingsService,
  ) {
    this.favDestination = this.messageService.favDestination;
    this.quickSearchTaskDestinations =
      this.updateDisplayDestinationsQuickSearch.pipe(
        switchMap((searchString) => {
          const lastDestinations =
            this.messageService.taskDestinations.getValue();
          if (searchString !== '') {
            return this.dataService.quickSearch(searchString).pipe(
              map((result) => {
                const d = [];
                if (searchString === '') {
                  return null;
                }
                for (const issue of result.issues) {
                  const exist = lastDestinations.findIndex((value) => {
                    return value.info.destination.id === issue.id;
                  });
                  if (exist === -1) {
                    const destination = {
                      destination: {
                        id: issue.id,
                        type: DestinationType.ISSUE,
                      },
                      name: `${issue.key} | ${issue.title}`,
                    };
                    d.push(
                      this.messageService.getOrCreateDestination(destination),
                    );
                  }
                }
                return d;
              }),
            );
          }
          return of([]);
        }),
      );
  }

  ngOnInit() {
    this.messageService.userDestinations
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((destinations) =>
        this.updateDisplayUserDestinations(destinations),
      );

    this.messageService.taskDestinations
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((destinations) =>
        this.updateDisplayTaskDestinations(destinations),
      );
  }

  async updateDisplayUserDestinations(destinations: MessageDestination[]) {
    this.userDestinations = [];
    let filtredUserDestinations = destinations.filter((userDestinations) => {
      if (userDestinations.info.destination.id === this.userService.getId()) {
        return false;
      }
      return true;
    });
    filtredUserDestinations = filtredUserDestinations.filter((item) => {
      return UserStatic.filter(
        (item.info as UserDestinationInfo).user,
        this.searchValue,
      );
    });
    if (this.searchValue) {
      filtredUserDestinations.sort((itemA, itemB) => {
        return UserStatic.compareForSearch(
          (itemA.info as UserDestinationInfo).user,
          (itemB.info as UserDestinationInfo).user,
          this.searchValue,
        );
      });
    }
    // userDestinations.info.unreadCount =
    // (
    //   await firstValueFrom(
    //     this.messageService.getDestination(
    //       userDestinations.info.destination.id
    //     )
    //   )
    // ).info.unreadCount || 0;
    // if (filtredUserDestinations.length > 0) {
    //   this.userDestinations.push({ type: 'separator', name: 'Users:' });
    // }

    this.userDestinations.push(...filtredUserDestinations);
    this.userDestinationsLength = this.userDestinations.length;
    if (this.showRecentUsers) {
      this.userDestinations = this.userDestinations.slice(0, this.maxUsers);
    }
    this.cd.markForCheck();
  }
  updateDisplayTaskDestinations(destinations: MessageDestination[]) {
    this.taskDestinations = [];

    const filtredDestinations = destinations.filter((destination) => {
      if (destination.info.name) {
        return (
          destination.info.name
            .toLowerCase()
            .indexOf(this.searchValue.toLowerCase()) > -1
        );
      } else {
        return false;
      }
    });
    // if (filtredDestinations.length > 0) {
    //   this.taskDestinations.push({type: 'separator', name: 'Tasks:'});
    // }
    const destinationsMark = [];
    const destinationsPulse = [];
    const destinationsOther = [];
    for (const destination of filtredDestinations) {
      if (destination.unreadCount.getValue() > 0) {
        destinationsMark.push(destination);
      } else if (destination.pulseCount.getValue() > 0) {
        destinationsPulse.push(destination);
      } else {
        destinationsOther.push(destination);
      }
    }
    this.taskDestinations.push(...destinationsMark.map((item) => item));
    this.taskDestinations.push(...destinationsPulse.map((item) => item));
    this.taskDestinations.push(...destinationsOther.map((item) => item));
    this.cd.markForCheck();
  }
  searchChange() {
    this.updateDisplayTaskDestinations(
      this.messageService.taskDestinations.getValue(),
    );
    this.updateDisplayDestinationsQuickSearch.next(this.searchValue);
    this.updateDisplayUserDestinations(
      this.messageService.userDestinations.getValue(),
    );
  }
  selectDestination(item: MessageDestination) {
    this.selected.next(item);
  }
}
