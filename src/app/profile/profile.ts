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
  currentUser?: User | null;
  myAnimals: Animal[] = [];
  pendingShelters: User[] = [];
  isEditing = false;
  showModal = false;
  editableAnimal: Partial<Animal> = {};
  tempImagePreview: string | null = null;

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
        if (remult.user) remult.user.imageUrl = savedUser.imageUrl;
        this.tempImagePreview = null;
        this.isEditing = false;
      }
    } catch (error: any) { alert(error.message); }
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
    if (!this.currentUser || !confirm("Are you sure?")) return;
    try {
      await remult.repo(User).delete(this.currentUser);
      await this.signOut(); 
    } catch (error: any) { alert(error.message); }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.showModal) this.editableAnimal.imageUrl = e.target.result;
        else if (this.currentUser) {
          this.tempImagePreview = e.target.result;
          this.currentUser.imageUrl = e.target.result;
          if (remult.user) remult.user.imageUrl = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.myAnimals.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }

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
}