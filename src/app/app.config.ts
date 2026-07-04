import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { routes } from './app.routes';

// Starts the entire Angular app
bootstrapApplication(App, {
  providers: [

    // Turns on the website page routing engine
    provideRouter(routes),

    //Turns on the tool for sending server API requests
    provideHttpClient(),
  ]

//Logs an error to the console if the app crashes at startup
}).catch(err => console.error(err));