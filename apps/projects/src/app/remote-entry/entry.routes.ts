import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { RwContainerService } from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { ActivityComponent } from '../activity/activity.component';
import { DetailComponent } from '../detail/detail.component';
import { ListComponent } from '../list/list.component';
import { MilestoneComponent } from '../milestone/milestone.component';
import { MilestonesComponent } from '../milestones/milestones.component';
import { ProjectService } from '../project.service';
import { SettingsComponent } from '../settings/settings.component';
import { SummaryComponent } from '../summary/summary.component';
import { TeamComponent } from '../team/team.component';
import { TemplateComponent } from '../template/template.component';

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};

  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => {
      return import(`../../i18n/${lang}.json`);
    };
  });

  return translocoInlineLoader;
};

const setCurrentProject = (route: ActivatedRouteSnapshot) => {
  inject(ProjectService).currentProjectKey.next(
    route.paramMap.get('containerKey'),
  );
};
const checkProjectKey = async (route: ActivatedRouteSnapshot) => {
  const container = await firstValueFrom(
    inject(RwContainerService).getContainerByKey(
      route.paramMap.get('containerKey'),
    ),
  );
  if (!container) {
    return createUrlTreeFromSnapshot(route, ['..']);
  }
  return true;
};
console.log(import.meta.url);
export const ROUTES: Route[] = [
  {
    path: '',
    providers: [
      ProjectService,
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'projects',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: ListComponent,
      },
      {
        path: ':containerKey',
        component: DetailComponent,
        resolve: [setCurrentProject],
        canActivate: [checkProjectKey],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'summary' },
          { path: 'summary', component: SummaryComponent },
          { path: 'milestone', component: MilestonesComponent },
          { path: 'milestone/:id', component: MilestoneComponent },
          { path: 'activity', component: ActivityComponent },
          // { path: 'backlog', component: BacklogComponent },
          { path: 'team', component: TeamComponent },
          { path: 'template', component: TemplateComponent },
          { path: 'settings', component: SettingsComponent },
        ],
      },
    ],
  },
];
