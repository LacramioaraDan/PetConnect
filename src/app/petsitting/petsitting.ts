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

  // Lists to hold users and posts data
  allPetsitters: User[] = []; 
  petsittersList: User[] = [];
  sitterPosts: SittingPost[] = [];
  
  // Track who is currently clicked and selected
  selectedUser: User | null = null; 
  remult = remult;

  // Values for the search filters
  filterLocation = '';
  filterPetsitterName = ''; 
  filterExperience = ''; 
  fullUser?: User;

  // Control variables for the pop-up modal box
  showModal = false;
  editableSittingPost: Partial<SittingPost> = {};

  // Control variables for the pop-up modal box
  isMenuOpen(post: any): boolean { return !!post['_showMenu']; }

  constructor(private router: Router) {}

  // Runs automatically when the screen loads up
  async ngOnInit() {

    // Look up full information for the currently logged-in user
    if (remult.user) {
      const user = await remult.repo(User).findId(remult.user.id);
      if (user) {
        this.fullUser = user;
      }
    }

    // Load every single pet sitter out of the database
    try {
      this.allPetsitters = await remult.repo(User).find({
        where: { role: 'petsitter' }
      });
      this.petsittersList = this.allPetsitters;
    } catch (error) {
      console.error("Failed to load petsitters from DB:", error);
    }
  }

  // Runs whenever you type into any filter box
  onFilterChange() {
    let tempPetsitters = [...this.allPetsitters];

    // Name filtering
    if (this.filterPetsitterName.trim()) {
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.name?.toLowerCase().includes(this.filterPetsitterName.toLowerCase())
      );
    }

    // Location filtering
    if (this.filterLocation.trim()) {
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.address?.toLowerCase().includes(this.filterLocation.toLowerCase())
      );
    }
    
    // Filtering by experience
    if (this.filterExperience.trim()) {
      tempPetsitters = tempPetsitters.filter(sitter => 
        sitter.experience?.toLowerCase().includes(this.filterExperience.toLowerCase())
      );
    }

    // Show only the matched sitters
    this.petsittersList = tempPetsitters;
  }

  // Open the 3-dots menu for post
  toggleMenu(post: any) {
    const currentState = !!post['_showMenu'];
    this.sitterPosts.forEach((p: any) => p['_showMenu'] = false);
    post['_showMenu'] = !currentState;
  }

  // Open pop-up box to edit an existing offer post
  openEditSittingModal(post: SittingPost) {
    this.editableSittingPost = { ...post };
    this.showModal = true;
  }

  // Delete an item forever after user clicks confirmation alert
  async deleteSittingPost(post: SittingPost) {
    if (!confirm('Delete this offer?')) return;
    try {
      await remult.repo(SittingPost).delete(post);
      this.sitterPosts = this.sitterPosts.filter(p => p.id !== post.id);
    } catch (error: any) { alert(error.message); }
  }

  // Runs when you click a sitter from the middle column list
  async selectSitter(sitter: User) {
    this.selectedUser = sitter;
    try {
      // Find and load all active offers created by this specific sitter
      this.sitterPosts = await remult.repo(SittingPost).find({
        where: { userId: sitter.id },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error("Failed loading sitter posts:", error);
    }
  }

  // Resets all the filters
  resetFilters() {
    
    this.filterLocation = '';
    this.filterPetsitterName = '';
    this.filterExperience = '';

    // Clear out active selections on the screen
    this.selectedUser = null;
    this.sitterPosts = [];

    // Reset list back to showing everyone
    this.petsittersList = this.allPetsitters;
  }

  // Jump over to the private direct message chat screen for this sitter
  openChatWithPetsitter(petsitterId: string) {
    if (!petsitterId) return;
    this.router.navigate(['/messages', petsitterId]);
  }

  // Open pop-up box with empty fields to create a brand new offer
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

  // Read a file upload from your device and turn it into an image URL link string
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Put uploaded image preview onto scree
        this.editableSittingPost.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Send new or edited pop-up form data up to the database to save it
  async savePost() {
    try {
      // If it's a completely new post, assign the currently logged-in user's ID as the author
      if (!this.editableSittingPost.id && remult.user) {
        this.editableSittingPost.userId = remult.user.id;
      }
      
      const saved = await remult.repo(SittingPost).save(this.editableSittingPost as SittingPost);
      
      // Sync local collection state cleanly
      const index = this.sitterPosts.findIndex(p => p.id === saved.id);
      if (index !== -1) {

        // Update our matching data arrays dynamically without needing a full page reload
        this.sitterPosts[index] = saved;
      } else if (this.selectedUser && this.selectedUser.id === saved.userId) {

        // Add new post on top of layout stream feed
        this.sitterPosts = [saved, ...this.sitterPosts];
      }
      
      // Close pop-up window
      this.showModal = false;
    } catch (error: any) {
      alert(error.message || "Failed saving offer instance");
    }
  }
}