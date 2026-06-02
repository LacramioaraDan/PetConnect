import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { remult } from 'remult';
import { Router } from '@angular/router';
import { User } from '../../shared/User';
import { Animal } from '../../shared/Animal';

@Component({
  selector: 'app-petsitting',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './petsitting.html', 
  styleUrl: './petsitting.css'       
})
export class PetSitting implements OnInit {
  allPetsitters: User[] = []; 
  petsittersList: User[] = [];
  sitterPosts: Animal[] = []; 
  
  selectedUser: User | null = null; 
  remult = remult;

  filterLocation = '';
  filterPetsitterName = ''; 

  showModal = false;
  editableAnimal: Partial<Animal> = {};

  constructor(private router: Router) {}

  async ngOnInit() {
    try {
      this.allPetsitters = await remult.repo(User).find({
        where: { role: 'petsitter' }
      });
      
      this.petsittersList = this.allPetsitters;
    } catch (error) {
      console.error("Failed to load petsitters from DB:", error);
    }
  }

  onFilterChange() {
    let tempPetsitters = [...this.allPetsitters];

    if (this.filterLocation.trim()) {
      const searchLoc = this.filterLocation.toLowerCase();
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.address?.toLowerCase().includes(searchLoc)
      );
    }

    if (this.filterPetsitterName.trim()) {
      const searchName = this.filterPetsitterName.toLowerCase();
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.name?.toLowerCase().includes(searchName)
      );
    }

    this.petsittersList = tempPetsitters;
  }

  async selectSitter(sitter: User) {
    this.selectedUser = sitter;
    try {
      // FIXED: Only load entries created explicitly as service listings on this channel
      this.sitterPosts = await remult.repo(Animal).find({
        where: { 
          userId: sitter.id,
          postType: 'sitting'
        },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error("Failed loading sitter posts:", error);
    }
  }

  openChatWithPetsitter(petsitterId: string) {
    if (!petsitterId) {
      alert("Error: Missing profile ID for chat.");
      return;
    }
    this.router.navigate(['/messages', petsitterId]);
  }

  // --- LOGICĂ FORMULAR MODAL CREARE POSTARE SITTER ---
  openAddModal() {
    this.editableAnimal = {
      name: '',
      species: '',
      age: '',
      gender: '',
      location: '',
      description: '',
      imageUrl: ''
    };
    this.showModal = true;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editableAnimal.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async savePost() {
    try {
      if (remult.user) {
        this.editableAnimal.userId = remult.user.id;
      }
      
      // FIXED: Tag this instance explicitly as a pet sitting offer so it avoids leaking into home feed
      this.editableAnimal.postType = 'sitting';

      const saved = await remult.repo(Animal).save(this.editableAnimal);
      
      if (this.selectedUser && this.selectedUser.id === remult.user?.id) {
        this.sitterPosts = [saved, ...this.sitterPosts];
      }
      
      this.showModal = false;
    } catch (error: any) {
      alert(error.message || "Failed saving offer instance");
    }
  }
}