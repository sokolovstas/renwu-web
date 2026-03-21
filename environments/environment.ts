import { RwCoreSettings } from '../libs/core/src/lib/settings-token';

export const environment = new RwCoreSettings();
environment.root = 'renwu.ru';
environment.production = false;
environment.envName = 'local';
environment.isDebug = true;
environment.maxSizeAttachment = 200 * 1024 * 1024;

environment.siteLoginUrl = `http://localhost:4321/login`;
environment.siteBillingUrl = `http://localhost:4321/profile`;
environment.siteInviteUrl = `http://localhost:4321/accept-invite`;
