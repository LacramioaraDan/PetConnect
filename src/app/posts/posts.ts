import { Component, OnDestroy, OnInit } from '@angular/core';
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
  // 1. Properties
  posts: Animal[] = [];
  allPosts: Animal[] = []; 
  postRepo = remult.repo(Animal);
  remult = remult;  
  fullUser?: User | null;

  // --- FILTERS AND VIEW STATE LOGIC MODEL PROPERTIES ---
  selectedUser: User | null = null; 
  filterSpecies = '';
  filterAge = '';
  filterGender = '';
  filterLocation = '';

  // --- NEW USER SEARCH SIDEBAR ENGINE ARRAYS ---
  searchUserQuery = '';
  filteredUsers: User[] = [];

  showModal = false;
  editableAnimal: Partial<Animal> = {}; 
  unSub: () => void = () => {};

  // 2. Lifecycle
  async ngOnInit() {
    this.fetchPosts();
    this.fetchCurrentUser();
  }
  
  ngOnDestroy() {
    if (this.unSub) this.unSub(); 
  }

  // 3. User Lookup Searching Logic
  async onUserSearch() {
    if (!this.searchUserQuery.trim()) {
      this.filteredUsers = [];
      return;
    }

    try {
      const search = this.searchUserQuery.toLowerCase();
      // Query users directly from database matching typed value criteria
      const results = await remult.repo(User).find();
      this.filteredUsers = results.filter(u => 
        u.name?.toLowerCase().includes(search)
      );
    } catch (error) {
      console.error("Failed searching for users:", error);
    }
  }

  selectUserFromSearch(user: User) {
    this.selectedUser = user;
    this.searchUserQuery = ''; // Clear input query once selected
    this.filteredUsers = [];   // Hide suggestion container panel
  }

  // 4. Data Loading
  async fetchPosts() {
    try {
      this.unSub = this.postRepo.liveQuery({
        include: { user: true },
        orderBy: { createdAt: "desc" } 
      }).subscribe((info) => {
        this.allPosts = info.applyChanges(this.allPosts);
        this.applyFilters();
      });
    } catch (error: any) {
      console.error("Failed to load animals", error);
    }
  }

  applyFilters() {
    let temp = [...this.allPosts];

    if (this.filterSpecies.trim()) {
      const searchSpecies = this.filterSpecies.toLowerCase();
      temp = temp.filter(p => p.species?.toLowerCase().includes(searchSpecies));
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
        
        const isVeryYoung = ageText.includes('month') ||
                            ageText.includes('week');

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

  viewUserProfile(user: User | undefined) {
    if (user) {
      this.selectedUser = user;
    }
  }

  async fetchCurrentUser() {
    if (remult.user) {
      this.fullUser = await remult.repo(User).findId(remult.user.id);
    }
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

  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.posts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  isMenuOpen(post: any): boolean {
    return !!post['_showMenu'];
  }

  openAddModal() {
    this.editableAnimal = {}; 
    this.showModal = true;
  }

  openEditModal(post: Animal) {
    (post as any)._showMenu = false;
    this.editableAnimal = { ...post }; 
    this.showModal = true;
  }

  async savePost() {
    try {
      if (!this.editableAnimal.id && remult.user) {
        this.editableAnimal.userId = remult.user.id;
      }
      await this.postRepo.save(this.editableAnimal);
      this.showModal = false;
    } catch (error: any) {
      alert(error.message);
    }
  }

  async deletePost(post: Animal) {
    (post as any)._showMenu = false;
    if (!confirm(`Are you sure you want to delete ${post.name}?`)) return;
    try {
      await this.postRepo.delete(post);
    } catch (error: any) {
      alert(error.message);
    }
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  startChat(userId: string) {
    if (!userId) {
      alert("Error: This post has no owner ID! Check your database.");
      return;
    }
    this.router.navigate(['/messages', userId]);
  }
}