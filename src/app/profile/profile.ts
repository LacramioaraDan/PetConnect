import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Animal } from '../../shared/Animal';
import { User } from '../../shared/User';
import { LostAndFoundPost } from '../../shared/LostAndFoundPosts';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SittingPost } from '../../shared/SittingPosts';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})

export class Profile implements OnInit {

  // Lists containing every type of posts 
  currentUser?: User | null;

  myAnimals: Animal[] = [];
  pendingShelters: User[] = [];
  editableAnimal: Partial<Animal> = {};

  mySittingOffers: SittingPost[] = [];
  editableSittingPost: Partial<SittingPost> = {};
  
  myLostAndFoundPosts: LostAndFoundPost[] = [];
  editableLostFoundPost: Partial<LostAndFoundPost> = {};
  isEditingLostFound = false;
  isEditingSitting = false;

  isEditing = false;
  showModal = false;
  tempImagePreview: string | null = null;

  fullUser: User | null | undefined = null;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  /* Runs automatically when the page loads */
  async ngOnInit() {
    await this.fetchCurrentUser();
    if (this.currentUser) {

      // If user is an admin, load up unverified shelter sign-up requests
      if (this.currentUser.role === 'admin') {
        this.pendingShelters = await remult.repo(User).find({
          where: { role: 'shelter', isVerified: false }
        });
      }

      // Load all lists belonging to this specific user
      await this.fetchMyAnimals();
      await this.fetchMySittingOffers();
      await this.fetchMyLostAndFoundPosts();
    }
  }

  // Gets data for the currently logged-in account
  async fetchCurrentUser() {
    if (remult.user) {
      this.currentUser = await remult.repo(User).findId(remult.user.id);
      this.fullUser = this.currentUser;
    }
  }

  // Gets user's active pet adoption listings
  async fetchMyAnimals() {
    if (this.currentUser) {
      this.myAnimals = await remult.repo(Animal).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  // Gets user's active pet sitting offer listings
  async fetchMySittingOffers() {
    if (this.currentUser) {
      this.mySittingOffers = await remult.repo(SittingPost).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  // Gets user's active missing or found pet posts
  async fetchMyLostAndFoundPosts() {
    if (this.currentUser) {
      this.myLostAndFoundPosts = await remult.repo(LostAndFoundPost).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  // Approves a registration request for a shelter account
  async approveShelter(id: string) {
    try {
      await User.approveShelter(id);
      this.pendingShelters = this.pendingShelters.filter(s => s.id !== id);
      alert("Shelter approved successfully!");
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    }
  }

  // Denies and deletes a pending shelter application
  async denyShelter(id: string) {
    if (!confirm("Are you sure you want to deny and permanently delete this shelter request?")) return;
    try {
      await User.denyShelter(id);
      this.pendingShelters = this.pendingShelters.filter(s => s.id !== id);
      alert("Shelter request denied and account deleted.");
    } catch (err: any) {
      alert("Denial failed: " + err.message);
    }
  }

  // Saves updated profile fields
  async saveProfile() {
    try {
      if (this.currentUser) {
        if (this.tempImagePreview) this.currentUser.imageUrl = this.tempImagePreview;
        const savedUser = await remult.repo(User).save(this.currentUser);
        
        // Updates active layout header components with new info immediately
        if (remult.user) {
          remult.user.imageUrl = savedUser.imageUrl;
          remult.user.name = savedUser.name;
        }
        
        this.tempImagePreview = null;
        this.isEditing = false;
      }
    } catch (error: any) { 
      alert(error.message); 
    }
  }

  // Reverts modified profile fields back to normal database values
  cancelEdit() {
    this.isEditing = false;
    this.tempImagePreview = null;
    this.fetchCurrentUser().then(() => {
      if (remult.user && this.currentUser) remult.user.imageUrl = this.currentUser.imageUrl;
    });
  }

  // Logs out the user and sends them back to the authentication page
  async signOut() {
    try {
      await lastValueFrom(this.http.post('/api/signOut', {}));
      remult.user = undefined;
      this.router.navigate(['/']);
    } catch (error: any) { remult.user = undefined; this.router.navigate(['/']); }
  }

  // Deletes the logged-in user account entirely
  async deleteAccount() {
    if (!this.fullUser || !confirm("Are you sure? This will permanently delete your account and all your posts.")) return;
    try {
      await User.deleteUserAccount(this.fullUser.id);
      await this.signOut(); 
    } catch (error: any) { 
      alert(error.message); 
    }
  }

  // Converts uploaded image files into a text-based format (Base64) to save online
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        
        // Assigns image to whichever entity form is actively being edited
        if (this.isEditingSitting) {
          this.editableSittingPost.imageUrl = base64Image;
        } else if (this.isEditingLostFound) {
          this.editableLostFoundPost.imageUrl = base64Image;
        } else {
          this.editableAnimal.imageUrl = base64Image;
          if (this.showModal === false && this.currentUser) {
              this.tempImagePreview = base64Image;
              this.currentUser.imageUrl = base64Image;
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Toggles the little edit/delete menu open or closed on a specific card block
  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];

    // Closes menus on all other active posts first so only one is open
    this.myAnimals.forEach((p: any) => p['_showMenu'] = false);
    this.mySittingOffers.forEach((p: any) => p['_showMenu'] = false);
    this.myLostAndFoundPosts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }

  // Opens the edit popup modal filled with a pet adoption post's current data
  openEditModal(post: Animal) {
    (post as any)._showMenu = false;
    this.editableAnimal = { ...post }; 
    this.isEditingSitting = false;
    this.isEditingLostFound = false;
    this.showModal = true;
  }

  // Saves changes made to a pet adoption post
  async savePost() {
    try {
      await remult.repo(Animal).save(this.editableAnimal);
      this.showModal = false;
      const index = this.myAnimals.findIndex(a => a.id === this.editableAnimal.id);
      if (index !== -1) this.myAnimals[index] = { ...this.myAnimals[index], ...this.editableAnimal } as Animal;
    } catch (error: any) { alert(error.message); }
  }

  // Permanently deletes a pet adoption post
  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete ${post.name}?`)) return;
    try {
      await remult.repo(Animal).delete(post);
      this.myAnimals = this.myAnimals.filter(a => a.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

  // Saves changes made to a sitting offer post
  async saveSittingPost() {
    try {
      await remult.repo(SittingPost).save(this.editableSittingPost);
      this.showModal = false;
      const index = this.mySittingOffers.findIndex(a => a.id === this.editableSittingPost.id);
      if (index !== -1) {
        this.mySittingOffers[index] = { ...this.mySittingOffers[index], ...this.editableSittingPost } as SittingPost;
      }
    } catch (error: any) { alert(error.message); }
  }

  // Permanently deletes a pet sitting offer post
  async deleteSittingPost(post: SittingPost) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete sitting offer ${post.name}?`)) return;
    try {
      await remult.repo(SittingPost).delete(post);
      this.mySittingOffers = this.mySittingOffers.filter(a => a.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

  // Opens the edit popup modal filled with a sitting offer's current data
  openEditSittingModal(post: SittingPost) {
    (post as any)._showMenu = false;
    this.editableSittingPost = { ...post }; 
    this.isEditingSitting = true; 
    this.isEditingLostFound = false;
    this.showModal = true;
  }

  // Opens the edit popup modal filled with a lost & found report's current data
  openEditLostFoundModal(post: LostAndFoundPost) {
    (post as any)._showMenu = false;
    this.editableLostFoundPost = { ...post };
    this.isEditingLostFound = true;
    this.isEditingSitting = false;
    this.showModal = true;
  }

  // Saves changes made to a lost & found post
  async saveLostFoundPost() {
    try {
      await remult.repo(LostAndFoundPost).save(this.editableLostFoundPost);
      this.showModal = false;
      this.isEditingLostFound = false;
      await this.fetchMyLostAndFoundPosts(); // Refresh client view safely
    } catch (error: any) { alert(error.message); }
  }

  // Permanently deletes a lost & found report post
  async deleteLostFoundPost(post: LostAndFoundPost) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete lost & found report for ${post.species}?`)) return;
    try {
      await remult.repo(LostAndFoundPost).delete(post);
      this.myLostAndFoundPosts = this.myLostAndFoundPosts.filter(p => p.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }
}