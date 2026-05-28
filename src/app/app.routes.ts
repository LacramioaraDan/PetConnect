import { Routes } from '@angular/router';
import { Posts } from './posts/posts';
import { Messages } from './messages/messages';
import { Shelters } from './shelters/shelters';
import { PetAdvisor } from './pet-advisor/pet-advisor';


export const routes: Routes = [
  { path: '', component: Posts }, 
  
  // This tells Angular: "When you see /messages/ANYTHING, load the Messages component"
  { path: 'messages/:userId', component: Messages },
  
  // This allows you to click the generic "Chat" icon in the navbar too
  { path: 'messages', component: Messages },

  { path: 'shelters', component: Shelters },

  { path: 'advisor', component: PetAdvisor }
];