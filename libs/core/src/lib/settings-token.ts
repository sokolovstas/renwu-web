import { InjectionToken } from '@angular/core';

export class RwCoreSettings {
  _root = 'renwu.ru';
  production = false;
  envName = 'base';
  isDebug = false;
  siteLoginUrl: string;
  siteInviteUrl: string;
  siteBillingUrl: string;
  siteApiUrl: string;
  mediaUrl: string;
  wsServerUrl: string;
  rootApiUrl: string;
  publicApiUrl: string;
  wsMessagesApiUrl: string;
  messagesApiUrl: string;
  maxSizeAttachment = 200 * 1024 * 1024;

  constructor() {
    this.updateURL();
  }

  set root(host: string) {
    this._root = host;
    this.updateURL();
  }

  updateURL() {
    this.siteLoginUrl = `https://${this._root}/login`;
    this.siteInviteUrl = `https://${this._root}/accept-invite`;
    this.siteBillingUrl = `https://${this._root}/profile`;
    this.siteApiUrl = `https://${this._root}/api/v1`;
    this.mediaUrl = `https://${this._root}/api/core/media`;
    this.wsServerUrl = `wss://${this._root}/api/core/ws`;
    this.rootApiUrl = `https://${this._root}/api/core/v1`;
    this.publicApiUrl = `https://${this._root}/api/core/public/v1`;
    this.wsMessagesApiUrl = `wss://${this._root}/api/messenger/ws`;
    this.messagesApiUrl = `https://${this._root}/api/messenger/v1`;
  }
}

export const RW_CORE_SETTINGS = new InjectionToken<RwCoreSettings>(
  'RW_CORE_SETTINGS',
  { providedIn: 'root', factory: () => new RwCoreSettings() },
);
