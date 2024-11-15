import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  Route,
  RouteReuseStrategy,
} from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private handlers = new Map<Route, DetachedRouteHandle>();

  public shouldDetach(): boolean {
    return true;
  }

  public store(
    route: ActivatedRouteSnapshot,
    handle: DetachedRouteHandle,
  ): void {
    if (!route.routeConfig) return;
    this.handlers.set(route.routeConfig, handle);
  }

  public shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && !!this.handlers.get(route.routeConfig);
  }

  public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig || !this.handlers.has(route.routeConfig))
      return null;
    return this.handlers.get(route.routeConfig);
  }

  public shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
