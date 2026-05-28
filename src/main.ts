// 1. Imports first
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';
import { Posts } from './app/posts/posts';
import { Shelters } from './app/shelters/shelters';
import { Messages } from './app/messages/messages';
import { Profile } from './app/profile/profile';
import { PetAdvisor } from './app/pet-advisor/pet-advisor';

// 2. Define the variable FIRST
export const routes: Routes = [
  { path: '', component: Posts },
  { path: 'shelters', component: Shelters },
  { path: 'profile', component: Profile },
  { path: 'advisor', component: PetAdvisor },
  // ADD THESE TWO:
  { path: 'messages', component: Messages },           // Generic inbox
  { path: 'messages/:userId', component: Messages },    // Specific chat with a user
];

// 3. Now use it in the bootstrap call SECOND
bootstrapApplication(App, {
  providers: [
    provideRouter(routes), 
    provideHttpClient()
  ]
}).catch((err) => console.error(err));