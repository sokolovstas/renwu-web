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

  private isLocalHost(): boolean {
    const h = this._root.toLowerCase();
    return (
      h.startsWith('localhost') ||
      h.startsWith('127.0.0.1') ||
      h.startsWith('[::1]')
    );
  }

  updateURL() {
    const http = this.isLocalHost() ? 'http' : 'https';
    const ws = this.isLocalHost() ? 'ws' : 'wss';
    this.siteLoginUrl = `${http}://${this._root}/login`;
    this.siteInviteUrl = `${http}://${this._root}/accept-invite`;
    this.siteBillingUrl = `${http}://${this._root}/profile`;
    this.siteApiUrl = `${http}://${this._root}/api/v1`;
    this.mediaUrl = `${http}://${this._root}/api/core/media`;
    this.wsServerUrl = `${ws}://${this._root}/api/core/ws`;
    this.rootApiUrl = `${http}://${this._root}/api/core/v1`;
    this.publicApiUrl = `${http}://${this._root}/api/core/public/v1`;
    this.wsMessagesApiUrl = `${ws}://${this._root}/api/messenger/ws`;
    this.messagesApiUrl = `${http}://${this._root}/api/messenger/v1`;
  }
}

export const RW_CORE_SETTINGS = new InjectionToken<RwCoreSettings>(
  'RW_CORE_SETTINGS',
  { providedIn: 'root', factory: () => new RwCoreSettings() },
);
