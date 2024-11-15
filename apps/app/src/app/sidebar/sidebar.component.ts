import { BehaviorSubject } from 'rxjs';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AsyncPipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuSidebarService, RenwuTourAnchorDirective } from '@renwu/app-ui';
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
@Component({
  selector: 'renwu-sidebar',
  standalone: true,
  imports: [
    RwIconComponent,
    RwDropDownComponent,
    MessageCounterComponent,
    AvatarComponent,
    NgClass,
    AsyncPipe,
    RouterLink,
    TranslocoPipe,
    RenwuTourAnchorDirective,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  animations: [
    trigger('visible', [
      state(
        '*',
        style({
          opacity: 1,
          transform: 'scale(1)',
        }),
      ),
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.95)',
        }),
      ),
      transition('* => void', animate('250ms ease')),
      transition('void => *', animate('250ms ease')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  cd = inject(ChangeDetectorRef);
  messageService = inject(RwMessageService);
  dataService = inject(RwDataService);
  siteDataService = inject(RwSiteDataService);
  userService = inject(RwUserService);
  sidebarService = inject(RenwuSidebarService);
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
    return;
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
