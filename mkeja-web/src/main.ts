import 'zone.js';

if (!Object.hasOwn) {
  Object.hasOwn = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
