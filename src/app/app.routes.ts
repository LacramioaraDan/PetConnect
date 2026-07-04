import { Routes } from '@angular/router';
import { Posts } from './posts/posts';
import { Messages } from './messages/messages';
import { Shelters } from './shelters/shelters';
import { PetAdvisor } from './pet-advisor/pet-advisor';
import { PetSitting } from './petsitting/petsitting';
import { LostAndFound } from './lost-and-found/lost-and-found';


export const routes: Routes = [
  
  { path: '', component: Posts }, 
  
  { path: 'messages/:userId', component: Messages },
  
  { path: 'messages', component: Messages },

  { path: 'shelters', component: Shelters },

  { path: 'advisor', component: PetAdvisor },

  { path: 'petsitting', component: PetSitting },

  {path: 'lost-and-found', component: LostAndFound}
];