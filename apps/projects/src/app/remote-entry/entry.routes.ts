import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  UrlTree,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';
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
const checkProjectKey = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const containerKey = route.paramMap.get('containerKey');
  if (!containerKey) {
    return createUrlTreeFromSnapshot(route, ['..']);
  }

  const container = await firstValueFrom(
    inject(RwContainerService).getContainerByKey(containerKey),
  ).catch((): null => null);

  // Keep deep-link URL on hard reload even if container lookup is not ready yet.
  if (!container) {
    return true;
  }
  return true;
};

const projectDetailChildren: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'summary' },
  { path: 'summary', component: SummaryComponent },
  { path: 'milestone', component: MilestonesComponent },
  { path: 'milestone/:id', component: MilestoneComponent },
  { path: 'activity', component: ActivityComponent },
  // { path: 'backlog', component: BacklogComponent },
  { path: 'team', component: TeamComponent },
  { path: 'template', component: TemplateComponent },
  { path: 'settings', component: SettingsComponent },
];
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
        children: projectDetailChildren,
      },
    ],
  },
];
