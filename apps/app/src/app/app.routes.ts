import { loadRemoteModule } from '@angular-architects/native-federation';
import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Route,
  RouterStateSnapshot,
} from '@angular/router';
import {
  RW_CORE_SETTINGS,
  RwDataService,
  RwWebsocketService,
} from '@renwu/core';
import { firstValueFrom } from 'rxjs';

const isAuth: CanActivateFn = async () => {
  const dataService = inject(RwDataService);
  const coreSettings = inject(RW_CORE_SETTINGS);
  const user = await firstValueFrom(dataService.getCurrentUser()).catch(
    () => null,
  );
  if (!user?.user?.id) {
    window.location.href = coreSettings.siteLoginUrl;
    return false;
  }
  return true;
};

async function updateTitle(
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) {
  const ws = inject(RwWebsocketService);
  ws.clearView();
  ws.pushView(state.url);
  ws.clearId('route');
  ws.pushId('route', childRoute.paramMap.get(childRoute.paramMap.keys[0]));
  ws.sendView();
}

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [isAuth],
    canActivateChild: [updateTitle],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () =>
          loadRemoteModule('dashboard', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'task',
        outlet: 'section',
        loadChildren: () =>
          loadRemoteModule('task', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'task',
        loadChildren: () =>
          loadRemoteModule('tasks', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'board',
        loadChildren: () =>
          loadRemoteModule('boards', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'project',
        loadChildren: () =>
          loadRemoteModule('projects', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'document',
        loadChildren: () =>
          loadRemoteModule('documents', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          loadRemoteModule('profile', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () =>
          loadRemoteModule('settings', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'messenger',
        loadChildren: () =>
          loadRemoteModule('messenger', './routes').then((m) => m.ROUTES),
      },
      {
        path: 'todo',
        loadChildren: () =>
          loadRemoteModule('todos', './routes').then((m) => m.ROUTES),
      },
    ],
  },
];
