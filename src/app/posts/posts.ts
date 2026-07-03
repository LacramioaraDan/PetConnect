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

  // Lists to store animal posts and user data
  posts: Animal[] = [];
  allPosts: Animal[] = [];
  postRepo = remult.repo(Animal);
  remult = remult;
  fullUser?: User | null;

  // Track who is selected and the active filter settings
  selectedUser: User | null = null;
  filterSpecies = '';
  filterAge = '';
  filterGender = '';
  filterLocation = '';

  // Track the sidebar user search tools
  searchUserQuery = '';
  filteredUsers: User[] = [];

  // Pop-up modal box visibility and form values
  showModal = false;
  editableAnimal: Partial<Animal> = {};
  unSub: () => void = () => {};
  activeUserFilter: User | null = null;
  isFilteringByUser = false;
  isUserMenuOpen = false;

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  // Runs automatically when the page opens up
  async ngOnInit() {
    this.fetchPosts();
    await this.fetchCurrentUser();

    // Check if we came from another page with a preset species filter
    this.route.queryParams.subscribe(params => {
      if (params['species']) {
        this.filterSpecies = params['species'];
        if (this.allPosts.length > 0) {
          this.applyFilters();
        }
      }
    });
  }

  // Cleans up active listeners when leaving this screen
  ngOnDestroy() {
    if (this.unSub) this.unSub();
  }

  // Helps Angular track list changes efficiently using unique IDs
  identify(index: number, item: Animal) {
    return item.id;
  }

  // Search for specific user profiles inside the database
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

  // Click a profile out of the autocomplete user search box
  selectUserFromSearch(user: User) {
    this.selectedUser = user;
    this.activeUserFilter = user;
    this.searchUserQuery = '';
    this.filteredUsers = [];
    this.isUserMenuOpen = false;
  }

  // Download all animal posts from the database and listen for real-time changes
  async fetchPosts() {
    try {
      this.unSub = this.postRepo.liveQuery({
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

  // Narrow down the screen stream feed to show only the selected user's items
  filterByUserOnly() {
    this.activeUserFilter = this.selectedUser;
    this.isFilteringByUser = true;
    this.applyFilters();
  }

  // Stop filtering by user and show everyone's items again
  showAllPosts() {
    this.activeUserFilter = null;
    this.isFilteringByUser = false; 
    this.applyFilters();
  }

  // The master filtering system that checks all search parameters
  applyFilters() {
    let temp = [...this.allPosts];

    // Filter down by selected user profile card
    if (this.isFilteringByUser && this.activeUserFilter) {
      temp = temp.filter(p => p.userId === this.activeUserFilter!.id);
    }

    // Filter down by species name typing
    if (this.filterSpecies.trim()) {
      const searchSpecies = this.filterSpecies.toLowerCase().trim();
      temp = temp.filter(p => p.species && p.species.toLowerCase().trim().includes(searchSpecies));
    }

    // Filter down by gender
    if (this.filterGender) {
      temp = temp.filter(p => p.gender === this.filterGender);
    }

    // Filter down by location
    if (this.filterLocation.trim()) {
      const searchLoc = this.filterLocation.toLowerCase();
      temp = temp.filter(p => p.location?.toLowerCase().includes(searchLoc));
    }

    // Filter down by age category
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

  // Clear all filters back to default empty settings
  resetFilters() {
    this.filterSpecies = '';
    this.filterAge = '';
    this.filterGender = '';
    this.filterLocation = '';
    
    this.selectedUser = null;
    this.activeUserFilter = null;
    this.isFilteringByUser = false;
    this.searchUserQuery = '';
    this.filteredUsers = [];

    this.applyFilters();
  }

  // Click on a poster's name to select them
  viewUserProfile(user: User | undefined) { if (user) this.selectedUser = user; }

  // Load information about the currently logged-in account
  async fetchCurrentUser() {
    if (remult.user) {
      this.fullUser = await remult.repo(User).findId(remult.user.id);
    }
  }

  // Read a file upload from your device and save it as an image link preview string
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.editableAnimal.imageUrl = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  // Delete a user profile account permanently out of the database (Admin only)
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

  // Open or close the dropdown setting choices for user account card management
  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  // Open or close the 3-dots post management options dropdown list
  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.posts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  // Check if a post menu is currently expanded
  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }
  
  // Open pop-up window to add a new post
  openAddModal() { this.editableAnimal = {}; this.showModal = true; }
  
    // Open pop-up window to edit a post
  openEditModal(post: Animal) { (post as any)._showMenu = false; this.editableAnimal = { ...post }; this.showModal = true; }

  // Save changes or newly created entries down into the server database
  async savePost() {
    try {
      if (!this.editableAnimal.id && remult.user) this.editableAnimal.userId = remult.user.id;
      await this.postRepo.save(this.editableAnimal);
      this.showModal = false;
    } catch (error: any) { alert(error.message); }
  }

  // Delete a listing post entirely from the database stream
  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Are you sure you want to delete ${post.name}?`)) return;
    try { await this.postRepo.delete(post); } catch (error: any) { alert(error.message); }
  }

  // Go to the mnessages page from a user's post
  startChat(userId: string) {
    if (!userId) { alert("Error: This post has no owner ID!"); return; }
    this.router.navigate(['/messages', userId]);
  }
}