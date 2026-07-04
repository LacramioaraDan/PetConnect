import { Routes } from '@angular/router';
import { Posts } from './posts/posts';
import { Messages } from './messages/messages';
import { Shelters } from './shelters/shelters';
import { PetAdvisor } from './pet-advisor/pet-advisor';
import { PetSitting } from './petsitting/petsitting';
import { LostAndFound } from './lost-and-found/lost-and-found';

// List of all web routes for the application
export const routes: Routes = [

  // Animal Adoptions Page
  { path: '', component: Posts }, 
  
  // Messages Page for a certain user
  { path: 'messages/:userId', component: Messages },
  
  // Messages Page
  { path: 'messages', component: Messages },

  // Shelters Page
  { path: 'shelters', component: Shelters },

  // Pet Advisor Page
  { path: 'advisor', component: PetAdvisor },

  // Pet Sitting Page
  { path: 'petsitting', component: PetSitting },

  //Lost And Found Page
  {path: 'lost-and-found', component: LostAndFound}
];