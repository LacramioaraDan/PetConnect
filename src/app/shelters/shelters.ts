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
  // Master lists loaded directly from the database
  allShelters: User[] = []; 
  allShelterAnimals: Animal[] = []; 

  // Filtered lists rendered in the HTML layout
  sheltersList: User[] = [];
  shelterAnimals: Animal[] = [];
  
  selectedShelterName = '';
  shelterImageUrl = ''; 
  remult = remult;

  // Filter binding models matching your input fields
  filterLocation = '';
  filterShelterName = ''; // <--- NEW PROPERTY FOR THE CENTER SEARCH BAR
  filterSpecies = '';
  filterAge = '';
  filterGender = '';

  constructor(private router: Router) {}

  async ngOnInit() {
    // Load ONLY VERIFIED shelters from the database
    this.allShelters = await remult.repo(User).find({
      where: { 
        role: 'shelter',
        isVerified: true // <--- THIS ENSURES ONLY VERIFIED SHELTERS ARE LOADED
      }
    });
    
    // Set initial display list to show all centers
    this.sheltersList = this.allShelters;
  }

  // Real-time joint filter evaluating location criteria alongside center names
  onLocationFilterChange() {
    let tempShelters = [...this.allShelters];

    // Apply location input constraint if text exists
    if (this.filterLocation.trim()) {
      const searchLoc = this.filterLocation.toLowerCase();
      tempShelters = tempShelters.filter(shelter => 
        shelter.address?.toLowerCase().includes(searchLoc)
      );
    }

    // Apply name search bar input constraint if text exists
    if (this.filterShelterName.trim()) {
      const searchName = this.filterShelterName.toLowerCase();
      tempShelters = tempShelters.filter(shelter => 
        shelter.name?.toLowerCase().includes(searchName)
      );
    }

    this.sheltersList = tempShelters;
  }

  // Combined animal filtering criteria matching the Home Page logic
  applyAnimalFilters() {
    let tempAnimals = [...this.allShelterAnimals];

    // 1. Species input field - Case-insensitive text search (.includes)
    if (this.filterSpecies.trim()) {
      const searchSpecies = this.filterSpecies.toLowerCase();
      tempAnimals = tempAnimals.filter(a => a.species?.toLowerCase().includes(searchSpecies));
    }

    // 2. Age Group selection - Advanced text logic for months/weeks vs years
    if (this.filterAge) {
      tempAnimals = tempAnimals.filter(a => {
        const ageText = a.age.toLowerCase();
        
        // Detect if the age format is written in months or weeks
        const isVeryYoung = ageText.includes('month') ||
                            ageText.includes('week');

        // Handle the 'baby' group filter route
        if (this.filterAge === 'baby') {
          if (isVeryYoung) return true;
          const ageNum = parseInt(a.age);
          return !isNaN(ageNum) && ageNum < 1;
        }

        // Stop puppy/kitten monthly values from leaking into older year buckets
        if (isVeryYoung) return false;

        // Fallback calculation for standard year values
        const ageNum = parseInt(a.age);
        if (isNaN(ageNum)) return ageText.includes(this.filterAge);
        
        if (this.filterAge === 'junior') return ageNum >= 1 && ageNum <= 2;
        if (this.filterAge === 'adult') return ageNum > 2 && ageNum <= 7;
        if (this.filterAge === 'senior') return ageNum > 7;
        return true;
      });
    }

    // 3. Gender option selector - Exact database string mapping
    if (this.filterGender) {
      tempAnimals = tempAnimals.filter(a => a.gender === this.filterGender);
    }

    this.shelterAnimals = tempAnimals;
  }

  openChatWithShelter(shelterId: string) {
    if (!shelterId) {
      alert("Error: Missing owner ID for chat.");
      return;
    }
    this.router.navigate(['/messages', shelterId]);
  }

  // Triggered when a user clicks "View Animals" on a shelter card
  async viewShelterAnimals(shelter: User) {
    this.selectedShelterName = shelter.name;
    this.shelterImageUrl = shelter.imageUrl; 
    
    // Reset view models for animal inputs whenever changing the selected shelter
    this.filterSpecies = '';
    this.filterAge = '';
    this.filterGender = '';

    try {
      // Query animal posts belonging exclusively to the selected shelter
      this.allShelterAnimals = await remult.repo(Animal).find({
        where: { userId: shelter.id }
      });
      
      // Populate active view list
      this.shelterAnimals = this.allShelterAnimals;
    } catch (error) {
      console.error("Failed to load shelter animals:", error);
    }
  }
}