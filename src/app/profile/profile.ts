import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Animal } from '../../shared/Animal';
import { User } from '../../shared/User';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit, OnDestroy {
  // --- CORE SYSTEM STATE FIELDS ---
  currentUser?: User | null;
  myAnimals: Animal[] = [];
  isEditing = false;
  
  // --- Form Modal Variable Declarations ---
  showModal = false;
  editableAnimal: Partial<Animal> = {};

  // FIXED: Added a temporary string memory buffer to handle uncommitted image selection states safely
  tempImagePreview: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    await this.fetchCurrentUser();
    if (this.currentUser) {
      await this.fetchMyAnimals();
    }
  }

  ngOnDestroy() {}

  async fetchCurrentUser() {
    if (remult.user) {
      this.currentUser = await remult.repo(User).findId(remult.user.id);
    }
  }

  async fetchMyAnimals() {
    if (this.currentUser) {
      this.myAnimals = await remult.repo(Animal).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  // --- PROFILE BACKEND ENGINE MANAGEMENT METHODS ---
  async saveProfile() {
    try {
      if (this.currentUser) {
        // Commit the temporary base64 file data buffer if one exists
        if (this.tempImagePreview) {
          this.currentUser.imageUrl = this.tempImagePreview;
        }

        const savedUser = await remult.repo(User).save(this.currentUser);
        
        // Commit change to the shared global Remult context navbar session safely on database confirmation
        if (remult.user) {
          remult.user.imageUrl = savedUser.imageUrl;
        }
        
        this.tempImagePreview = null;
        this.isEditing = false;
      }
    } catch (error: any) {
      alert(error.message);
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.tempImagePreview = null; // Discard un-saved photo data modifications
    
    // Fetch a clean snapshot value copy from your DB tables instance repository
    this.fetchCurrentUser().then(() => {
      // FIXED: Safely reset the top header navbar component frame tracking view to match your DB image state entry link
      if (remult.user && this.currentUser) {
        remult.user.imageUrl = this.currentUser.imageUrl;
      }
    });
  }

  async signOut() {
    try {
      await lastValueFrom(this.http.post('/api/signOut', {}));
      remult.user = undefined;
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error("Logout failed:", error);
      remult.user = undefined;
      this.router.navigate(['/']);
    }
  }

  async deleteAccount() {
    if (!this.currentUser || !confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      await remult.repo(User).delete(this.currentUser);
      await this.signOut(); 
    } catch (error: any) {
      alert(error.message);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.showModal) {
          this.editableAnimal.imageUrl = e.target.result;
        } else if (this.currentUser) {
          // FIXED: Map data strings to local visual preview tracking parameters first instead of altering persistent data blocks instantly
          this.tempImagePreview = e.target.result;
          this.currentUser.imageUrl = e.target.result;
          
          // Provide instant local feedback on selecting a new picture option
          if (remult.user) {
            remult.user.imageUrl = e.target.result;
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // --- TIMELINE OVERLAY ACTION INTERACTION METHODS ---
  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.myAnimals.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean {
    return !!post['_showMenu'];
  }

  openEditModal(post: Animal) {
    (post as any)._showMenu = false;
    this.editableAnimal = { ...post }; 
    this.showModal = true;
  }

  async savePost() {
    try {
      await remult.repo(Animal).save(this.editableAnimal);
      this.showModal = false;
      
      const index = this.myAnimals.findIndex(a => a.id === this.editableAnimal.id);
      if (index !== -1) {
        this.myAnimals[index] = { ...this.myAnimals[index], ...this.editableAnimal } as Animal;
      }
    } catch (error: any) {
      alert(error.message);
    }
  }

  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Are you sure you want to delete ${post.name}?`)) return;
    try {
      await remult.repo(Animal).delete(post);
      this.myAnimals = this.myAnimals.filter(a => a.id !== post.id);
    } catch (error: any) {
      alert(error.message);
    }
  }
}