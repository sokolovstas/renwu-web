// configuration structure, backwards compatible with earlier versions

import { EventEmitter, InjectionToken, Type } from '@angular/core';
import { Observable } from 'rxjs';

export interface RwMentionsModuleConfig {
  mentionsListComponent: Type<MentionsList<unknown>>;
}

export const RW_MENTIONS_MODULE_CONFIG =
  new InjectionToken<RwMentionsModuleConfig>('RwMention config');

export interface MentionsConfig {
  // nested config
  mentions?: Mentions<unknown>[];
  listComponent?: Type<unknown>;
}

export interface Mentions<T> {
  triggerChars: string[];

  // Show list only on n char to skip space
  showSearchListAtChar?: number;

  // whether to allow space while mentioning or not
  allowSpace?: boolean;

  // option to include the trigger char in the searchTerm event
  returnTrigger?: boolean;

  // item list component
  itemComponent: Type<MentionsListItem<T>>;

  searchListProps?: Partial<MentionsList<unknown>>;

  getItems: (filter: string) => Observable<T[]>;

  // optional function to format the selected item before inserting the text
  mentionSelect?: (item: T, triggerChars?: string[]) => string;
}

export interface MentionsList<T> {
  items: T[];
  activeItem: T;
  itemComponent: Type<MentionsListItem<T>>;
  itemClick: EventEmitter<T>;
  labelKey: string;

  position(
    nativeParentElement: HTMLInputElement,
    iframe?: HTMLIFrameElement,
  ): void;

  up(): void;
  down(): void;
}

export interface MentionsListItem<T> {
  item: T;
  active: boolean;
}
