import { BehaviorSubject, combineLatest } from 'rxjs';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwSidebarService,
  RwTourAnchorDirective,
  SidebarSection,
} from '@renwu/app-ui';
import { RwDropDownComponent, RwIconComponent } from '@renwu/components';
import {
  AvatarComponent,
  Instance,
  MessageCounterComponent,
  RW_CORE_SETTINGS,
  RwDataService,
  RwSiteDataService,
  RwUserService,
} from '@renwu/core';
import { RwMessageService } from '@renwu/messaging';
import {
  loadSidebarRecents,
  MOBILE_NAV_SLOT_COUNT,
  partitionSidebarSections,
  rememberSidebarSection,
  saveSidebarRecents,
  sidebarSectionStorageKey,
} from './sidebar-overflow';

@Component({
  selector: 'renwu-sidebar',
  standalone: true,
  imports: [
    RwIconComponent,
    RwDropDownComponent,
    MessageCounterComponent,
    AvatarComponent,
    AsyncPipe,
    RouterLink,
    TranslocoPipe,
    RwTourAnchorDirective,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, AfterViewInit {
  cd = inject(ChangeDetectorRef);
  messageService = inject(RwMessageService);
  dataService = inject(RwDataService);
  siteDataService = inject(RwSiteDataService);
  userService = inject(RwUserService);
  sidebarService = inject(RwSidebarService);
  coreSettings = inject(RW_CORE_SETTINGS);
  router = inject(Router);

  instances = this.siteDataService.getInstances();

  dragging = false;

  hoverTab = '';
  unread = 0;
  pulse = 0;
  todos = 0;

  version = '';

  destroy = inject(DestroyRef);
  todoDestination = {
    pulseCount: new BehaviorSubject<number>(0),
    unreadCount: new BehaviorSubject<number>(0),
  };

  leaveTimeout = -1;
  closedTimeout = -1;

  tasksCurrentView = '';

  @ViewChild('navRow')
  navRow?: ElementRef<HTMLElement>;

  @ViewChild('overflowRoot')
  overflowRoot?: ElementRef<HTMLElement>;

  visibleSections: SidebarSection[] = [];
  overflowSections: SidebarSection[] = [];
  overflowOpen = false;

  private allSections: SidebarSection[] = [];
  private activeKey: string | null = null;
  private recentKeys = loadSidebarRecents();
  private slotCount?: number;
  private fittedWidth = -1;
  private mobileNav = false;
  private mobileQuery?: MediaQueryList;
  private resizeObserver?: ResizeObserver;
  private fitFrame = 0;
  private fitting = false;

  private readonly onMobileChange = (): void => {
    this.mobileNav = this.mobileQuery?.matches ?? false;
    this.slotCount = undefined;
    this.fittedWidth = -1;
    this.scheduleFit();
  };

  // @HostListener('mouseleave', [])
  // onMouseLeave(layerX: any) {
  // if (this.dragging) {
  //   return;
  // }
  // this.leaveTimeout = setTimeout(() => {
  //   this.setState('');
  // }, 300);
  // }

  // @HostListener('mouseenter', [])
  // onMouseEnter(layerX: any) {
  //   clearTimeout(this.leaveTimeout);
  // }
  constructor() {
    this.dataService.getVersion().subscribe((version) => {
      this.version = version;
      this.cd.markForCheck();
    });

    this.userService.todos
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((todos) => {
        this.todoDestination.pulseCount.next(
          todos ? todos.filter((item) => !item.is_done).length : 0,
        );
      });

    // this.shortcutService.subscribe('Backquote', () => {
    //   this.stateService.messagingOpened.next(
    //     !this.stateService.messagingOpened.getValue()
    //   );
    // });
    // this.shortcutService.subscribe('IntlBackslash', () => {
    //   this.stateService.messagingOpened.next(
    //     !this.stateService.messagingOpened.getValue()
    //   );
    // });
    // this.shortcutService.subscribe('KeyS', () => {
    //   this.setState('search', true);
    // });
    // this.shortcutService.subscribe('KeyF', () => {
    //   this.tasksCurrentView = 'fav';
    //   this.setState('tasks', true);
    // });
    // this.shortcutService.subscribe('KeyR', () => {
    //   this.tasksCurrentView = 'recent';
    //   this.setState('tasks', true);
    // });
    // this.shortcutService.subscribe('KeyP', () => {
    //   this.setState('perstodo', true);
    // });
    // this.shortcutService.subscribe('KeyW', () => {
    //   this.tasksCurrentView = 'watcher';
    //   this.setState('tasks', true);
    // });
    // this.shortcutService.subscribe('KeyT', () => {
    //   this.setState('todo', true);
    // });
    // this.shortcutService.subscribe('Escape', () => {
    // this.setState('void', true);
    // this.stateService.hideMessaging();
    // });
    // this.stateService.sidebarState.subscribe((state) => {
    //   this.state = state;
    //   this.cd.markForCheck();
    // });
  }

  ngOnInit() {
    this.mobileQuery = window.matchMedia('(width < 852px)');
    this.mobileNav = this.mobileQuery.matches;
    this.mobileQuery.addEventListener('change', this.onMobileChange);
    this.destroy.onDestroy(() => {
      this.mobileQuery?.removeEventListener('change', this.onMobileChange);
      this.resizeObserver?.disconnect();
      cancelAnimationFrame(this.fitFrame);
    });

    combineLatest([
      this.sidebarService.sidebarSections,
      this.sidebarService.currentSection,
    ])
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([sections, current]) => {
        this.allSections = sections ?? [];
        this.activeKey = current ? sidebarSectionStorageKey(current) : null;
        this.noteVisit(current);
        this.applySplit(this.slotCount ?? this.defaultSlotCount());
        this.cd.markForCheck();
        this.scheduleFit();
      });
  }

  ngAfterViewInit(): void {
    const row = this.navRow?.nativeElement;
    if (row && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.fitting) {
          this.scheduleFit();
        }
      });
      this.resizeObserver.observe(row);
    }
    this.scheduleFit();
  }

  get overflowHasMessenger(): boolean {
    return this.overflowSections.some(
      (section) => section.path === 'messenger',
    );
  }

  sectionTrack(section: SidebarSection): string {
    return `${section.icon}:${section.path ?? ''}:${section.tour ?? ''}`;
  }

  toggleOverflow(): void {
    this.overflowOpen = !this.overflowOpen;
    this.cd.markForCheck();
  }

  selectSection(section: SidebarSection): void {
    this.noteVisit(section);
    const key = sidebarSectionStorageKey(section);
    if (key != null) {
      this.activeKey = key;
    }
    this.sidebarService.setSection(section);
    this.overflowOpen = false;
    this.applySplit(this.slotCount ?? this.defaultSlotCount());
    this.cd.markForCheck();
    this.scheduleFit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.overflowOpen) {
      return;
    }
    const root = this.overflowRoot?.nativeElement;
    if (root?.contains(event.target as Node)) {
      return;
    }
    this.overflowOpen = false;
    this.cd.markForCheck();
  }

  private noteVisit(section: SidebarSection | null | undefined): void {
    if (!section) {
      return;
    }
    const next = rememberSidebarSection(this.recentKeys, section);
    if (
      next.length === this.recentKeys.length &&
      next.every((key, index) => key === this.recentKeys[index])
    ) {
      return;
    }
    this.recentKeys = next;
    saveSidebarRecents(this.recentKeys);
  }

  private defaultSlotCount(): number {
    if (!this.mobileNav) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.min(this.allSections.length, MOBILE_NAV_SLOT_COUNT);
  }

  private applySplit(slotCount: number): boolean {
    const split = partitionSidebarSections(
      this.allSections,
      slotCount,
      this.activeKey,
      this.recentKeys,
    );
    const sameVisible =
      split.visible.length === this.visibleSections.length &&
      split.visible.every(
        (section, index) => section === this.visibleSections[index],
      );
    const sameOverflow =
      split.overflow.length === this.overflowSections.length &&
      split.overflow.every(
        (section, index) => section === this.overflowSections[index],
      );
    this.slotCount = slotCount;
    if (sameVisible && sameOverflow) {
      return false;
    }
    this.visibleSections = split.visible;
    this.overflowSections = split.overflow;
    if (!split.overflow.length) {
      this.overflowOpen = false;
    }
    return true;
  }

  private scheduleFit(): void {
    cancelAnimationFrame(this.fitFrame);
    this.fitFrame = requestAnimationFrame(() => this.fitNav());
  }

  private fitNav(): void {
    if (this.fitting) {
      return;
    }
    const row = this.navRow?.nativeElement;
    if (!row || !this.allSections.length) {
      return;
    }
    this.fitting = true;
    try {
      if (!this.mobileNav) {
        if (this.applySplit(Number.POSITIVE_INFINITY)) {
          this.cd.detectChanges();
        }
        return;
      }

      if (this.applySplit(MOBILE_NAV_SLOT_COUNT)) {
        this.cd.detectChanges();
      }
      this.fittedWidth = row.clientWidth;
    } finally {
      this.fitting = false;
    }
  }

  // onSetState(state: string) {
  //   this.setState(state);
  // }
  // setState(state: string, explicit: boolean = false) {
  //   if (this.state === state && !explicit) {
  //     this.state = 'void';
  //   } else {
  //     this.state = state;
  //   }
  //   this.stateService.sidebarState.next(this.state);
  //   this.cd.markForCheck();
  // }
  // switchMessenger() {
  //   this.stateService.messagingOpened.next(
  //     !this.stateService.messagingOpened.getValue()
  //   );
  // }
  logout() {
    this.siteDataService.logout().subscribe(() => {
      window.location.href = this.coreSettings.siteLoginUrl;
    });
  }
  // openSettings() {
  //   setTimeout(() => {
  //     this.router.navigate([
  //       '/',
  //       'settings',
  //       this.stateService.currentSettingsView,
  //     ]);
  //   });
  //   this.router.navigate([{ outlets: { messages: null } }]);
  // }
  // openNewIssue() {
  //   const issue: any = {};
  //   issue.id = 'new';
  // FIXME
  // this.issueService.openIssue(issue);
  // }
  close() {
    // this.setState('void');
  }
  changeInstance(instance: Instance) {
    this.siteDataService.changeInstance(instance.id).subscribe(() => {
      location.href = '';
    });
  }
  // toggleChat() {
  //   if (window['Tawk_API']) {
  //     window['Tawk_API'].toggle();
  //   }
  // }
}
