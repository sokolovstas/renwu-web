import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import {
  AppDateFormat,
  ISelectModel,
  RW_SELECT_MODELS,
  RW_TABLE_SETTINGS,
} from '@renwu/components';
import { catchError, firstValueFrom, forkJoin, mergeMap, of } from 'rxjs';
import { ExternalUserScope } from './container/container.model';
import { RwContainerService } from './container/container.service';
import { RwPolicyService } from './policy/policy.service';
import { SelectModelContainer } from './select/container';
import { SelectModelDictionary } from './select/dictionary';
import { SelectModelStringDictionary } from './select/dictionary-string';
import { SelectModelHolidays } from './select/holidays';
import { SelectModelMilestones } from './select/milestone';
import { SelectModelString } from './select/string';
import { SelectModelTimezone } from './select/timezones';
import { SelectModelUser } from './select/user';
import { RW_CORE_SETTINGS, RwCoreSettings } from './settings-token';
import { DefaultColumnsSettings } from './settings/settings-columns';
import { AppLangs, AppThemes } from './settings/settings.model';
import { RwSettingsService } from './settings/settings.service';
import { StateService } from './state/state.service';
import { UserStatus, UserType } from './user/user.model';
import { RwUserService } from './user/user.service';
import { RwWebsocketService } from './websocket/websocket.service';

import { TranslocoService } from '@ngneat/transloco';
import { SelectModelLabel } from './select/label';

export function initSelectorModels(): Record<string, () => ISelectModel<any>> {
  return {
    Workflow: () => new SelectModelDictionary('dictionary/workflows'),
    Holidays: () => new SelectModelHolidays(),
    ExternalUserScope: () =>
      new SelectModelString([
        { id: ExternalUserScope.SELF, label: 'Only user task' },
        {
          id: ExternalUserScope.EXTERNAL,
          label: 'All external task in project',
        },
      ]),
    UserType: () =>
      new SelectModelString([
        { id: UserType.INTERNAL, label: 'Internal' },
        { id: UserType.DUMMY, label: 'Dummy' },
        { id: UserType.EXTERNAL, label: 'External' },
      ]),
    Container: () => new SelectModelContainer(),
    Milestone: () => new SelectModelMilestones(),
    Assignee: () => new SelectModelUser(true, true, 1),
    Watcher: () => new SelectModelUser(true, true),
    Type: () => new SelectModelDictionary('dictionary/type'),
    Priority: () => new SelectModelDictionary('dictionary/priority'),
    Resolution: () => new SelectModelDictionary('dictionary/resolution'),
    Label: () =>
      new SelectModelStringDictionary('dictionary/labels', true, true),
    Skills: () => new SelectModelDictionary('dictionary/skills'),
    Status: () => new SelectModelDictionary('dictionary/status'),
    Transition: () => new SelectModelDictionary('issue/:id/transitions'),
    MilestoneLabel: () => new SelectModelLabel(true, true),
    UserStatus: () =>
      new SelectModelString([
        { id: UserStatus.ACTIVE, label: 'Active' },
        { id: UserStatus.PENDING, label: 'Pending' },
        { id: UserStatus.DELETED, label: 'Deleted' },
      ]),
    AppThemes: () =>
      new SelectModelString([
        { id: AppThemes.AUTO, label: 'Auto' },
        { id: AppThemes.LIGHT, label: 'Light' },
        { id: AppThemes.DARK, label: 'Dark' },
      ]),
    AppLanguages: () =>
      new SelectModelString([
        { id: AppLangs.RU, label: 'Russian' },
        { id: AppLangs.EN, label: 'English' },
      ]),
    AppDateFormat: () =>
      new SelectModelString([
        { id: AppDateFormat.RU, label: 'Russian' },
        { id: AppDateFormat.EN_US, label: 'English US' },
        { id: AppDateFormat.EN_GB, label: 'English GB' },
        { id: AppDateFormat.ZH_CN, label: 'Chinese' },
      ]),
    Timezones: () => new SelectModelTimezone(),
  };
}

function initApp(): () => Promise<void> {
  const userService = inject(RwUserService);
  const containerService = inject(RwContainerService);
  const policyService = inject(RwPolicyService);
  const websocketService = inject(RwWebsocketService);
  const transloco = inject(TranslocoService);
  const settingsService = inject(RwSettingsService);

  const stateService = inject(StateService);

  return async (): Promise<void> => {
    websocketService.create();

    settingsService.loadSettings();
    stateService.ready.next(true);

    await firstValueFrom(
      forkJoin([userService.init(), containerService.init()])
        .pipe(
          mergeMap(() => {
            stateService.setFromProfile(userService.getUser().settings.profile);
            const lang = userService.getUser().settings.profile.language;
            transloco.setActiveLang(lang);
            return forkJoin([
              transloco.load(lang),
              settingsService.init(userService.getId()),
              policyService.init(),
            ]);
          }),
        )
        .pipe(catchError(() => of(false))),
    );
  };
}

export function provideRenwuCore(
  settings: RwCoreSettings,
): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
    },
    {
      provide: RW_CORE_SETTINGS,
      useValue: settings,
    },
    {
      provide: RW_TABLE_SETTINGS,
      useValue: DefaultColumnsSettings,
    },
    {
      provide: RW_SELECT_MODELS,
      deps: [Injector],
      useFactory: initSelectorModels,
    },
  ];

  return makeEnvironmentProviders(providers);
}

// const createInlineLoader = (languages: Array<string>): InlineLoader => {
//   const translocoInlineLoader: InlineLoader = {};

//   languages.forEach((language) => {
//     translocoInlineLoader[language] = () =>
//       import(`../../i18n/${language}.json`);
//   });

//   return translocoInlineLoader;
// };

// @Injectable({ providedIn: 'root' })
// export class TranslocoHttpLoader implements TranslocoLoader {;
//   constructor(private http: HttpClient) {}

//   getTranslation(lang: string): Promise<Translation> {
//     return fetch(`/i18n/${lang}.json`).then((r) => r.json());
//   }
// }
