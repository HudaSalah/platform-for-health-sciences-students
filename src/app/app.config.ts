import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { ProgressStorage } from './core/services/progress-storage';
import { LocalStorageProgressStorage } from './core/services/local-storage-progress-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ProgressStorage, useClass: LocalStorageProgressStorage },
  ],
};