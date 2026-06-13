import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { remult } from 'remult';
import { Router } from '@angular/router';
import { User } from '../../shared/User';
import { SittingPost } from '../../shared/SittingPosts';

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
  sitterPosts: SittingPost[] = [];
  
  selectedUser: User | null = null; 
  remult = remult;

  filterLocation = '';
  filterPetsitterName = ''; 
  filterExperience = ''; 
  fullUser?: User;

  showModal = false;
  editableSittingPost: Partial<SittingPost> = {};
  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }

  constructor(private router: Router) {}

  async ngOnInit() {

    if (remult.user) {
      const user = await remult.repo(User).findId(remult.user.id);
      if (user) {
        this.fullUser = user;
      }
    }

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
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.address?.toLowerCase().includes(this.filterLocation.toLowerCase())
      );
    }
    
    if (this.filterExperience.trim()) {
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.experience?.toLowerCase().includes(this.filterExperience.toLowerCase())
      );
    }

    this.petsittersList = tempPetsitters;
  }

  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.sitterPosts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  openEditSittingModal(post: SittingPost) {
    this.editableSittingPost = { ...post };
    this.showModal = true;
  }

  async deleteSittingPost(post: SittingPost) {
    if (!confirm('Delete this offer?')) return;
    try {
      await remult.repo(SittingPost).delete(post);
      this.sitterPosts = this.sitterPosts.filter(p => p.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

  async selectSitter(sitter: User) {
    this.selectedUser = sitter;
    try {
      // Acum căutăm direct în tabelul de SittingPost
      this.sitterPosts = await remult.repo(SittingPost).find({
        where: { userId: sitter.id },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error("Failed loading sitter posts:", error);
    }
  }

  // --- Filter System Operations ---
  resetFilters() {
    // 1. Reset text input filter values back to empty strings
    this.filterLocation = '';
    this.filterPetsitterName = '';
    this.filterExperience = '';

    // 2. Clear out the focused pet sitter card selection and active posts
    this.selectedUser = null;
    this.sitterPosts = [];

    // 3. Restore the display list to reflect the raw array of loaded sitters
    this.petsittersList = this.allPetsitters;
  }

  openChatWithPetsitter(petsitterId: string) {
    if (!petsitterId) return;
    this.router.navigate(['/messages', petsitterId]);
  }

  openAddModal() {
    this.editableSittingPost = {
      name: '',
      species: '',
      experience: '',
      pricing: '',
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
        this.editableSittingPost.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async savePost() {
    try {
      if (remult.user) {
        this.editableSittingPost.userId = remult.user.id;
      }
      
      // Salvare directă în SittingPost
      const saved = await remult.repo(SittingPost).save(this.editableSittingPost as SittingPost);
      
      if (this.selectedUser && this.selectedUser.id === remult.user?.id) {
        this.sitterPosts = [saved, ...this.sitterPosts];
      }
      
      this.showModal = false;
    } catch (error: any) {
      alert(error.message || "Failed saving offer instance");
    }
  }
}