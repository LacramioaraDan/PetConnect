import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Animal } from '../../shared/Animal';
import { User } from '../../shared/User';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts implements OnInit, OnDestroy {
  posts: Animal[] = [];
  allPosts: Animal[] = [];
  postRepo = remult.repo(Animal);
  remult = remult;
  fullUser?: User | null;

  selectedUser: User | null = null;
  filterSpecies = '';
  filterAge = '';
  filterGender = '';
  filterLocation = '';

  searchUserQuery = '';
  filteredUsers: User[] = [];

  showModal = false;
  editableAnimal: Partial<Animal> = {};
  unSub: () => void = () => {};
  activeUserFilter: User | null = null;
  isFilteringByUser = false;
  isUserMenuOpen = false;

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.fetchPosts();
    await this.fetchCurrentUser();

    // Catch parameter tokens coming from the advisor workflow redirect
    this.route.queryParams.subscribe(params => {
      if (params['species']) {
        this.filterSpecies = params['species'];
        if (this.allPosts.length > 0) {
          this.applyFilters();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unSub) this.unSub();
  }

  identify(index: number, item: Animal) {
    return item.id;
  }

  async onUserSearch() {
    if (!this.searchUserQuery.trim()) {
      this.filteredUsers = [];
      return;
    }
    try {
      const search = this.searchUserQuery.toLowerCase();
      const results = await remult.repo(User).find({
        where: {
          $or: [
            { role: { "!=": "shelter" } },
            { role: "shelter", isVerified: true }
          ]
        }
      });
      this.filteredUsers = results.filter(u => u.name?.toLowerCase().includes(search));
    } catch (error) {
      console.error("Failed searching for users:", error);
    }
  }

  selectUserFromSearch(user: User) {
    this.selectedUser = user;
    this.activeUserFilter = user;
    this.searchUserQuery = '';
    this.filteredUsers = [];
    this.isUserMenuOpen = false;
  }

  async fetchPosts() {
    try {
      this.unSub = this.postRepo.liveQuery({
        where: { postType: 'adoption' },
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }).subscribe((info) => {
        this.allPosts = info.applyChanges(this.allPosts);
        this.allPosts.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        this.applyFilters();
        this.cdr.markForCheck();
      });
    } catch (error: any) {
      console.error("Failed to load animals", error);
    }
  }

  filterByUserOnly() {
    this.activeUserFilter = this.selectedUser;
    this.isFilteringByUser = true;
    this.applyFilters();
  }

  showAllPosts() {
    this.activeUserFilter = null;
    this.isFilteringByUser = false; 
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.allPosts];
    temp = temp.filter(p => p.postType !== 'sitting');

    if (this.isFilteringByUser && this.activeUserFilter) {
      temp = temp.filter(p => p.userId === this.activeUserFilter!.id);
    }

    // Find this block inside applyFilters() in posts.ts and update it:
    if (this.filterSpecies.trim()) {
      const searchSpecies = this.filterSpecies.toLowerCase().trim();
      
      // FIXED: Force the database item species field to lowercase before matching
      temp = temp.filter(p => p.species && p.species.toLowerCase().trim().includes(searchSpecies));
    }

    if (this.filterGender) {
      temp = temp.filter(p => p.gender === this.filterGender);
    }

    if (this.filterLocation.trim()) {
      const searchLoc = this.filterLocation.toLowerCase();
      temp = temp.filter(p => p.location?.toLowerCase().includes(searchLoc));
    }

    if (this.filterAge) {
      temp = temp.filter(p => {
        const ageText = p.age.toLowerCase();
        const isVeryYoung = ageText.includes('month') || ageText.includes('week');
        if (this.filterAge === 'baby') {
          if (isVeryYoung) return true;
          const ageNum = parseInt(p.age);
          return !isNaN(ageNum) && ageNum < 1;
        }
        if (isVeryYoung) return false;
        const ageNum = parseInt(p.age);
        if (isNaN(ageNum)) return ageText.includes(this.filterAge);
        
        if (this.filterAge === 'junior') return ageNum >= 1 && ageNum <= 2;
        if (this.filterAge === 'adult') return ageNum > 2 && ageNum <= 7;
        if (this.filterAge === 'senior') return ageNum > 7;
        return true;
      });
    }
    this.posts = temp;
  }

  // --- Filter System Operations ---
  resetFilters() {
    this.filterSpecies = '';
    this.filterAge = '';
    this.filterGender = '';
    this.filterLocation = '';
    
    // Clear the active user filter contexts if applicable
    this.selectedUser = null;
    this.activeUserFilter = null;
    this.isFilteringByUser = false;
    this.searchUserQuery = '';
    this.filteredUsers = [];

    this.applyFilters();
  }

  viewUserProfile(user: User | undefined) { if (user) this.selectedUser = user; }

  async fetchCurrentUser() {
    if (remult.user) {
      this.fullUser = await remult.repo(User).findId(remult.user.id);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.editableAnimal.imageUrl = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  async deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete the account for ${user.name}? This cannot be undone.`)) return;
    try {
      await User.deleteUserAccount(user.id);
      this.selectedUser = null;
      alert("User account deleted.");
      this.onUserSearch(); 
    } catch (error: any) {
      alert(error.message);
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.posts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }
  openAddModal() { this.editableAnimal = {}; this.showModal = true; }
  openEditModal(post: Animal) { (post as any)._showMenu = false; this.editableAnimal = { ...post }; this.showModal = true; }

  async savePost() {
    try {
      if (!this.editableAnimal.id && remult.user) this.editableAnimal.userId = remult.user.id;
      await this.postRepo.save(this.editableAnimal);
      this.showModal = false;
    } catch (error: any) { alert(error.message); }
  }

  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Are you sure you want to delete ${post.name}?`)) return;
    try { await this.postRepo.delete(post); } catch (error: any) { alert(error.message); }
  }

  startChat(userId: string) {
    if (!userId) { alert("Error: This post has no owner ID!"); return; }
    this.router.navigate(['/messages', userId]);
  }
}