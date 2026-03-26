import { Injectable, inject } from '@angular/core';
import {
  RwShortcutService as ComponentsRwShortcutService,
  ShortcutHandler,
  ShortcutObservable,
  ShortcutOptions,
} from '@renwu/components';

/**
 * Core wrapper around the shared shortcut implementation from `@renwu/components`.
 * This exists so remote apps can depend on `@renwu/core` only.
 */
@Injectable({
  providedIn: 'root',
})
export class RwShortcutService {
  private componentsShortcutService = inject(ComponentsRwShortcutService);

  subscribe(value: string, callback: ShortcutHandler): ShortcutObservable;
  subscribe(
    value: string,
    callback: ShortcutHandler,
    options: ShortcutOptions,
  ): ShortcutObservable;
  subscribe(
    value: string,
    callback: ShortcutHandler,
    options?: ShortcutOptions,
  ): ShortcutObservable | null {
    return this.componentsShortcutService.subscribe(value, callback, options);
  }

  pause(value: string): void {
    this.componentsShortcutService.pause(value);
  }

  continue(value: string): void {
    this.componentsShortcutService.continue(value);
  }
}

export { ShortcutObservable, ShortcutOptions, ShortcutHandler };

