import { initFederation } from '@angular-architects/native-federation';
declare global {
  interface Window {
    global: Window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    require: any;
  }
}

window.global = window;

initFederation('assets/federation.manifest.json')
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap').catch((err) => console.error(err)));
