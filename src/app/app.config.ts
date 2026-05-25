import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { routes } from './app.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes), // THIS IS WHAT MAKES NAVIGATION WORK
    provideHttpClient(),
  ]
}).catch(err => console.error(err));