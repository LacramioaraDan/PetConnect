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
import { PetSitting } from './app/petsitting/petsitting';
import { LostAndFound } from './app/lost-and-found/lost-and-found';

// Maps screen components to specific web address links (URLs)
export const routes: Routes = [
  { path: '', component: Posts },
  { path: 'shelters', component: Shelters },
  { path: 'profile', component: Profile },
  { path: 'advisor', component: PetAdvisor },
  { path: 'messages', component: Messages },
  { path: 'messages/:userId', component: Messages },
  { path: 'petsitting', component: PetSitting},
  { path: 'lost-and-found', component: LostAndFound}
];

// Starts the whole website application and injects the links and server connection tools
bootstrapApplication(App, {
  providers: [ provideRouter(routes), provideHttpClient()]
}).catch((err) => console.error(err));