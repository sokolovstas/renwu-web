// import { ModuleWithProviders, NgModule } from '@angular/core';
// import {
//   RwMentionsModuleConfig,
//   RW_MENTIONS_MODULE_CONFIG,
// } from './mentions-config';
// import { BaseMentionsListItemComponent } from './mentions-list-item.component';
// import { BaseMentionsListComponent } from './mentions-list.component';
// import { MentionsDirective } from './mentions.directive';

// @NgModule({
//   declarations: [
//     MentionsDirective,
//     BaseMentionsListComponent,
//     BaseMentionsListItemComponent,
//   ],
//   imports: [],
//   exports: [MentionsDirective, BaseMentionsListItemComponent],
// })
// export class RwMentionsModule {
//   static forRoot(
//     config: RwMentionsModuleConfig = {
//       mentionsListComponent: BaseMentionsListComponent,
//     }
//   ): ModuleWithProviders<RwMentionsModule> {
//     return {
//       ngModule: RwMentionsModule,
//       providers: [
//         {
//           provide: RW_MENTIONS_MODULE_CONFIG,
//           useValue: config,
//         },
//       ],
//     };
//   }
// }

// export {
//   RwMentionsModuleConfig,
//   RW_MENTIONS_MODULE_CONFIG,
//   Mentions,
// } from './mentions-config';
// export { BaseMentionsListItemComponent } from './mentions-list-item.component';
// export { BaseMentionsListComponent } from './mentions-list.component';
// export { MentionsDirective } from './mentions.directive';
