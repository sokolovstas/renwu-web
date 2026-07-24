import { initFederation } from '@angular-architects/native-federation';
declare global {
  interface Window {
    global: Window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    require: any;
  }
}

window.global = window;

// Root-absolute against <base href> so deep links (/settings/jira) don't resolve
// host remoteEntry/shared bundles as /settings/remoteEntry.json (NF default is ./).
const deployUrl = document.baseURI;
initFederation(new URL('assets/federation.manifest.json', deployUrl).href, {
  deployUrl,
})
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap').catch((err) => console.error(err)));
