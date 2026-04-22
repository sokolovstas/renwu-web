import { RwCoreSettings } from '../libs/core/src/lib/settings-token';

export const environment = new RwCoreSettings();
environment.root = 'localhost:8080';
environment.production = false;
environment.envName = 'local';
environment.isDebug = true;
environment.maxSizeAttachment = 200 * 1024 * 1024;
