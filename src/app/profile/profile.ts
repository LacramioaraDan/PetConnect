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
export class Profile implements OnInit, OnDestroy {
  currentUser?: User | null;
  myAnimals: Animal[] = [];
  pendingShelters: User[] = [];
  isEditing = false;
  showModal = false;
  editableAnimal: Partial<Animal> = {};
  tempImagePreview: string | null = null;
  mySittingOffers: SittingPost[] = [];
  editableSittingPost: Partial<SittingPost> = {};
  
  // Lost and Found Additions
  myLostAndFoundPosts: LostAndFoundPost[] = [];
  editableLostFoundPost: Partial<LostAndFoundPost> = {};
  isEditingLostFound = false;
  isEditingSitting = false;

  fullUser: User | null | undefined = null;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  async ngOnInit() {
    await this.fetchCurrentUser();
    if (this.currentUser) {
      if (this.currentUser.role === 'admin') {
        this.pendingShelters = await remult.repo(User).find({
          where: { role: 'shelter', isVerified: false }
        });
      }
      await this.fetchMyAnimals();
      await this.fetchMySittingOffers();
      await this.fetchMyLostAndFoundPosts();
    }
  }

  ngOnDestroy() {}

  async fetchCurrentUser() {
    if (remult.user) {
      this.currentUser = await remult.repo(User).findId(remult.user.id);
      this.fullUser = this.currentUser;
    }
  }

  async fetchMyAnimals() {
    if (this.currentUser) {
      this.myAnimals = await remult.repo(Animal).find({
        where: { userId: this.currentUser.id, postType: 'adoption' },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async fetchMySittingOffers() {
    if (this.currentUser) {
      this.mySittingOffers = await remult.repo(SittingPost).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async fetchMyLostAndFoundPosts() {
    if (this.currentUser) {
      this.myLostAndFoundPosts = await remult.repo(LostAndFoundPost).find({
        where: { userId: this.currentUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async approveShelter(id: string) {
    try {
      await User.approveShelter(id);
      this.pendingShelters = this.pendingShelters.filter(s => s.id !== id);
      alert("Shelter approved successfully!");
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    }
  }

  async saveProfile() {
    try {
      if (this.currentUser) {
        if (this.tempImagePreview) this.currentUser.imageUrl = this.tempImagePreview;
        const savedUser = await remult.repo(User).save(this.currentUser);
        
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

  cancelEdit() {
    this.isEditing = false;
    this.tempImagePreview = null;
    this.fetchCurrentUser().then(() => {
      if (remult.user && this.currentUser) remult.user.imageUrl = this.currentUser.imageUrl;
    });
  }

  async signOut() {
    try {
      await lastValueFrom(this.http.post('/api/signOut', {}));
      remult.user = undefined;
      this.router.navigate(['/']);
    } catch (error: any) { remult.user = undefined; this.router.navigate(['/']); }
  }

  async deleteAccount() {
    if (!this.fullUser || !confirm("Are you sure? This will permanently delete your account and all your posts.")) return;
    try {
      await User.deleteUserAccount(this.fullUser.id);
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
        const base64Image = e.target.result;
        
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

  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.myAnimals.forEach((p: any) => p['_showMenu'] = false);
    this.mySittingOffers.forEach((p: any) => p['_showMenu'] = false);
    this.myLostAndFoundPosts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }

  openEditModal(post: Animal) {
    (post as any)._showMenu = false;
    this.editableAnimal = { ...post }; 
    this.isEditingSitting = false;
    this.isEditingLostFound = false;
    this.showModal = true;
  }

  async savePost() {
    try {
      await remult.repo(Animal).save(this.editableAnimal);
      this.showModal = false;
      const index = this.myAnimals.findIndex(a => a.id === this.editableAnimal.id);
      if (index !== -1) this.myAnimals[index] = { ...this.myAnimals[index], ...this.editableAnimal } as Animal;
    } catch (error: any) { alert(error.message); }
  }

  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete ${post.name}?`)) return;
    try {
      await remult.repo(Animal).delete(post);
      this.myAnimals = this.myAnimals.filter(a => a.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

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

  async deleteSittingPost(post: SittingPost) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete sitting offer ${post.name}?`)) return;
    try {
      await remult.repo(SittingPost).delete(post);
      this.mySittingOffers = this.mySittingOffers.filter(a => a.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

  openEditSittingModal(post: SittingPost) {
    (post as any)._showMenu = false;
    this.editableSittingPost = { ...post }; 
    this.isEditingSitting = true; 
    this.isEditingLostFound = false;
    this.showModal = true;
  }

  // Lost and Found Action Methods
  openEditLostFoundModal(post: LostAndFoundPost) {
    (post as any)._showMenu = false;
    this.editableLostFoundPost = { ...post };
    this.isEditingLostFound = true;
    this.isEditingSitting = false;
    this.showModal = true;
  }

  async saveLostFoundPost() {
    try {
      await remult.repo(LostAndFoundPost).save(this.editableLostFoundPost);
      this.showModal = false;
      this.isEditingLostFound = false;
      await this.fetchMyLostAndFoundPosts(); // Refresh client view safely
    } catch (error: any) { alert(error.message); }
  }

  async deleteLostFoundPost(post: LostAndFoundPost) {
    (post as any)._showMenu = false;
    if (!confirm(`Delete lost & found report for ${post.species}?`)) return;
    try {
      await remult.repo(LostAndFoundPost).delete(post);
      this.myLostAndFoundPosts = this.myLostAndFoundPosts.filter(p => p.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }
}