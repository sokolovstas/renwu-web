import { RwCoreSettings } from '../libs/core/src/lib/settings-token';

export const environment = new RwCoreSettings();
environment.root = 'renwu.ru';
environment.production = true;
environment.envName = 'local';
environment.isDebug = false;
environment.maxSizeAttachment = 200 * 1024 * 1024;
