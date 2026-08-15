import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RenwuSearchOverlayService } from '@renwu/app-ui';
import { RwShortcutService } from '@renwu/core';

@Component({
  selector: 'renwu-search-spotlight-host',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './search-spotlight-host.component.html',
  styleUrl: './search-spotlight-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSpotlightHostComponent implements OnInit, AfterViewInit {
  @ViewChild('anchor', { read: ViewContainerRef })
  anchor?: ViewContainerRef;

  readonly overlay = inject(RenwuSearchOverlayService);
  private readonly shortcuts = inject(RwShortcutService);
  private readonly destroy = inject(DestroyRef);
  private readonly cd = inject(ChangeDetectorRef);

  failed = false;
  private loading = false;
  private loaded = false;
  private pendingLoad = false;

  constructor() {
    const keyK = this.shortcuts.subscribe(
      'KeyK',
      () => this.overlay.toggle(),
      { meta: true, skipInput: false },
    );
    const slash = this.shortcuts.subscribe('Slash', () => this.overlay.show(), {
      meta: false,
      skipInput: true,
    });
    this.destroy.onDestroy(() => {
      keyK.unsubscribe();
      slash.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.overlay.open$.pipe(takeUntilDestroyed(this.destroy)).subscribe((open) => {
      if (open) {
        void this.ensureRemote();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.pendingLoad) {
      void this.ensureRemote();
    }
  }

  private async ensureRemote(): Promise<void> {
    if (this.loaded || this.loading) {
      return;
    }
    if (!this.anchor) {
      this.pendingLoad = true;
      return;
    }
    this.loading = true;
    this.failed = false;
    try {
      const remote = await loadRemoteModule('search', './Spotlight');
      const component = remote.SearchSpotlightComponent;
      if (!this.anchor || !component) {
        throw new Error('Search spotlight remote is missing');
      }
      this.anchor.clear();
      this.anchor.createComponent(component);
      this.loaded = true;
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    }
  }
}
