import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { remult } from 'remult';
import { User } from '../../shared/User';
import { Animal } from '../../shared/Animal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './shelters.html',
  styleUrl: './shelters.css'
})
export class Shelters implements OnInit {

  // Shelters lists from the database
  allShelters: User[] = []; 
  allShelterAnimals: Animal[] = []; 

  // Filtered shelters lists
  sheltersList: User[] = [];
  shelterAnimals: Animal[] = [];
  
  selectedShelterName = '';
  shelterImageUrl = ''; 
  remult = remult;

  // Filtering fields
  filterLocation = '';
  filterShelterName = '';
  filterSpecies = '';
  filterAge = '';
  filterGender = '';

  constructor(private router: Router) {}

  /* Runs automatically when the page loads */
  async ngOnInit() {

    // Loads ONLY shelters that have been approved by an admin
    this.allShelters = await remult.repo(User).find({
      where: { 
        role: 'shelter',
        isVerified: true
      }
    });
    
    // Shows all verified shelters by default when starting
    this.sheltersList = this.allShelters;
  }

  // Filters the shelters list based on location and name inputs
  onLocationFilterChange() {
    let tempShelters = [...this.allShelters];

    // Filter by location
    if (this.filterLocation.trim()) {
      const searchLoc = this.filterLocation.toLowerCase();
      tempShelters = tempShelters.filter(shelter => 
        shelter.address?.toLowerCase().includes(searchLoc)
      );
    }

    // Filter by shelter name
    if (this.filterShelterName.trim()) {
      const searchName = this.filterShelterName.toLowerCase();
      tempShelters = tempShelters.filter(shelter => 
        shelter.name?.toLowerCase().includes(searchName)
      );
    }

    this.sheltersList = tempShelters;
  }

  // Filters the animals list based on species, age, and gender inputs
  applyAnimalFilters() {
    let tempAnimals = [...this.allShelterAnimals];

    // Filter by species text
    if (this.filterSpecies.trim()) {
      const searchSpecies = this.filterSpecies.toLowerCase();
      tempAnimals = tempAnimals.filter(a => a.species?.toLowerCase().includes(searchSpecies));
    }

    // Filter by age group
    if (this.filterAge) {
      tempAnimals = tempAnimals.filter(a => {
        const ageText = a.age.toLowerCase();
        
        const isVeryYoung = ageText.includes('month') || ageText.includes('week');

        if (this.filterAge === 'baby') {
          if (isVeryYoung) return true;
          const ageNum = parseInt(a.age);
          return !isNaN(ageNum) && ageNum < 1;
        }

        if (isVeryYoung) return false;

        const ageNum = parseInt(a.age);
        if (isNaN(ageNum)) return ageText.includes(this.filterAge);
        
        if (this.filterAge === 'junior') return ageNum >= 1 && ageNum <= 2;
        if (this.filterAge === 'adult') return ageNum > 2 && ageNum <= 7;
        if (this.filterAge === 'senior') return ageNum > 7;
        return true;
      });
    }

    // Filter by gender choice
    if (this.filterGender) {
      tempAnimals = tempAnimals.filter(a => a.gender === this.filterGender);
    }

    this.shelterAnimals = tempAnimals;
  }

  // Resets all active filters
  resetFilters() {

    this.filterLocation = '';
    this.filterShelterName = '';
    this.filterSpecies = '';
    this.filterAge = '';
    this.filterGender = '';
    this.selectedShelterName = '';
    this.shelterImageUrl = '';
    this.allShelterAnimals = [];
    this.shelterAnimals = [];

    this.sheltersList = this.allShelters;
  }

  // Redirects the user to the chat screen with this shelter
  openChatWithShelter(shelterId: string) {
    if (!shelterId) {
      alert("Error: Missing owner ID for chat.");
      return;
    }
    this.router.navigate(['/messages', shelterId]);
  }

  // Allows users to see all active posts of the selected shelter
  async viewShelterAnimals(shelter: User) {
    this.selectedShelterName = shelter.name;
    this.shelterImageUrl = shelter.imageUrl; 
    
    this.filterSpecies = '';
    this.filterAge = '';
    this.filterGender = '';

    try {
      // Fetch only the animals that belong to this chosen shelter
      this.allShelterAnimals = await remult.repo(Animal).find({
        where: { userId: shelter.id }
      });
      
      this.shelterAnimals = this.allShelterAnimals;
    } catch (error) {
      console.error("Failed to load shelter animals:", error);
    }
  }
}