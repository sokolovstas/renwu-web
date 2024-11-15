/*
 * Public API Surface of rw-mentions
 */
export * from './lib/mentions-config';
// export * from './lib/mentions.module';
export {
  RwMentionsModuleConfig,
  RW_MENTIONS_MODULE_CONFIG,
  Mentions,
} from './lib/mentions-config';
export { BaseMentionsListItemComponent } from './lib/mentions-list-item.component';
export { BaseMentionsListComponent } from './lib/mentions-list.component';
export { MentionsDirective } from './lib/mentions.directive';
