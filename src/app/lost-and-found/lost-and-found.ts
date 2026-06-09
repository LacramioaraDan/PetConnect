import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { LostAndFoundPost } from '../../shared/LostAndFoundPosts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lost-and-found',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lost-and-found.html',
  styleUrl: './lost-and-found.css',
})
export class LostAndFound implements OnInit, OnDestroy {
  remult = remult;

  posts: LostAndFoundPost[] = [];
  allPosts: LostAndFoundPost[] = [];
  postRepo = remult.repo(LostAndFoundPost);
  
  // Single backing model for modal bindings
  editablePost: Partial<LostAndFoundPost> = {};

  // Filters grouping configuration
  filters = {
    species: '',
    gender: '',
    lastSeenLocation: '',
    postType: '',
    weightRange: '',
    microchipped: null as boolean | null,
    colors: '',
    size: '',
    breed: '',
    pattern: '',
    age: '',
    collarDetails: ''
  };

  // Modal / Visibility State
  showModal = false;
  unSub: () => void = () => {};

  // --- Virtual Chatbot State Tracker ---
  currentStep = -1; 

  collectedTraits: { [key: string]: string } = {
    species: '',
    breed: '',
    age: '',
    gender: '',
    lastSeenLocation: '',
    size: '',
    colors: '',
    pattern: '',
    weightRange: '',
    microchipped: '',
    collarDetails: '',
    distinguishingFeatures: ''
  };

  chatSteps = [
    { field: 'species', question: "What **species** are we looking for? (e.g., Dog, Cat, Rabbit) 🐶🐱" },
    { field: 'breed', question: "Do you know their **breed**? If you're not sure, just type 'no' or 'unknown'. 🐕" },
    { field: 'age', question: "What **age group** do they belong to? (baby, junior, adult, senior) 🍼" },
    { field: 'gender', question: "Are they **Male** or **Female**? ♂️♀️" },
    { field: 'lastSeenLocation', question: "What **city or area** were they last seen in? 📍" },
    { field: 'size', question: "What is their **size scale**? (Small, Medium, Large) 📐" },
    { field: 'weightRange', question: "What is their approximate **weight range**? (e.g., 5-10 kg) ⚖️" },
    { field: 'microchipped', question: "Is your pet **microchipped**? (Type: Yes, No, or Unknown) 💾" },
    { field: 'colors', question: "What **colors** is their fur? You can add multiple separated by commas (e.g., Brown, White). 🎨" },
    { field: 'pattern', question: "Do they have a specific **pattern**? (e.g., Spotted, Brindle, Solid, Calico) 🦓" },
    { field: 'collarDetails', question: "Were they wearing a **collar**? If yes, please describe it! 🏷️" },
    { field: 'distinguishingFeatures', question: "Any **distinguishing features**? (e.g., white socks on paws, torn left ear) ✨" }
  ];

  chatMessages: { sender: 'user' | 'bot', text: string }[] = [
    { 
      sender: 'bot', 
      text: "Hello, I am Buddy, your virtual pet finder assistant! I can help look through the posts on our platform to see if any of them match your lost pet. Are you ready to look for your missing friend together! 🕵️‍♂️" 
    }
  ];
  userChatInput = '';

  // Core authenticated logging profile context
  fullUser: any;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  async ngOnInit() {
    this.fetchPosts();
  }

  ngOnDestroy() { 
    if (this.unSub) this.unSub(); 
  }

  async fetchPosts() {
    this.unSub = this.postRepo.liveQuery({
      include: { user: true },
      orderBy: { createdAt: "desc" }
    }).subscribe((info) => {
      this.allPosts = info.applyChanges(this.allPosts);
      this.applyFilters();
      this.cdr.markForCheck();
    });
  }

  // --- Filter System Operations ---
  resetFilters() {
    this.filters = {
      species: '', gender: '', lastSeenLocation: '', postType: '',
      weightRange: '', microchipped: null, colors: '',
      size: '', breed: '', pattern: '', age: '', collarDetails: ''
    };
    this.applyFilters();
  }

  applyFilters() {
    this.posts = this.allPosts.filter(p => {
      const match = (val: string, filter: string) => 
        !filter || !filter.trim() || (val && val.toLowerCase().includes(filter.toLowerCase()));

      const colorsMatch = !this.filters.colors || !this.filters.colors.trim() || 
        (p.colors && this.filters.colors.toLowerCase().split(',')
          .map(c => c.trim())
          .every(color => p.colors.map(c => c.toLowerCase()).includes(color)));

      return (
        match(p.species, this.filters.species) &&
        match(p.gender, this.filters.gender) &&
        match(p.lastSeenLocation, this.filters.lastSeenLocation) &&
        match(p.weightRange, this.filters.weightRange) &&
        match(p.size, this.filters.size) &&
        match(p.breed, this.filters.breed) &&
        match(p.pattern, this.filters.pattern) &&
        match(p.age, this.filters.age) &&
        match(p.collarDetails, this.filters.collarDetails) &&
        (!this.filters.postType || p.postType === this.filters.postType) &&
        (this.filters.microchipped === null || p.microchipped === this.filters.microchipped) &&
        colorsMatch
      );
    });
  }

  // --- CRUD Modals & Operations ---
  openAddModal() { 
    this.editablePost = { 
      species: '',
      breed: '',
      age: '',
      gender: '',
      postType: 'lost',
      lastSeenLocation: '',
      collarDetails: '',
      microchipped: false,
      imageUrl: '',
      description: '',
      status: 'lost', 
      size: '',
      pattern: '',
      weightRange: '',
      distinguishingFeatures: '',
      colors: [] 
    }; 
    this.showModal = true; 
  }

  openEditModal(post: LostAndFoundPost) { 
    this.editablePost = { ...post }; 
    this.showModal = true; 
  }

  async savePost() {
    try {
      if (!this.editablePost.id && remult.user) {
        this.editablePost.userId = remult.user.id;
      }
      await this.postRepo.save(this.editablePost);
      this.showModal = false;
    } catch (error: any) { 
      alert(error.message); 
    }
  }

  async deletePost(post: LostAndFoundPost) {
    if (!confirm(`Are you sure you want to delete this ${post.species} post?`)) return;
    try { 
      await this.postRepo.delete(post); 
    } catch (error: any) { 
      alert(error.message); 
    }
  }

  // --- Layout Helper Accessors ---
  toggleMenu(post: LostAndFoundPost) {
    (post as any)._showMenu = !(post as any)._showMenu;
  }

  isMenuOpen(post: LostAndFoundPost): boolean {
    return !!(post as any)._showMenu;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editablePost.imageUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // --- Communication Services ---
  startChat(userId: string) {
    if (!userId) {
      alert("Error: This post has no owner ID!");
      return;
    }
    this.router.navigate(['/messages', userId]);
  }

  // --- Step-by-Step Chat Bot Logic ---
  async sendMessage() {
    if (!this.userChatInput.trim()) return;

    const userText = this.userChatInput.trim();
    const lowerText = userText.toLowerCase();
    
    // 1. Instantly push user text to display it on screen
    this.chatMessages.push({ sender: 'user', text: userText });
    this.userChatInput = '';
    this.cdr.markForCheck();

    // NEW INTERCEPTOR: Handle polite thank you phrases gracefully
    if (lowerText.includes('thank you') || lowerText === 'thanks' || lowerText === 'thank u' || lowerText.includes('thank you')) {
      setTimeout(() => {
        this.chatMessages.push({
          sender: 'bot',
          text: "You are so very welcome! 🐾 I really hope you find your sweet buddy soon. Let me know if you want to start a new search anytime! ❤️"
        });
        this.cdr.markForCheck();
      }, 600);
      return; // Stop execution here so it doesn't trigger a new database search loop
    }

    // 2. GREETING STAGE (Step -1)
    if (this.currentStep === -1) {
      this.currentStep = 0; 
      
      setTimeout(() => {
        this.chatMessages.push({
          sender: 'bot',
          text: `Let's do it! 💪<br><br>${this.chatSteps[0].question}`
        });
        this.cdr.markForCheck();
      }, 600);
      return; 
    }

    // 3. TRAIT QUESTION POOL PROCESSING STAGE
    if (this.currentStep < this.chatSteps.length) {
      const currentField = this.chatSteps[this.currentStep].field;

      if (lowerText === 'no' || lowerText === 'skip' || lowerText === 'unknown') {
        this.collectedTraits[currentField] = '';
      } else {
        this.collectedTraits[currentField] = userText;
      }

      this.currentStep++;
    }

    // Determine whether to ask the next question or perform the lookup match
    if (this.currentStep < this.chatSteps.length) {
      setTimeout(() => {
        this.chatMessages.push({
          sender: 'bot',
          text: this.chatSteps[this.currentStep].question
        });
        this.cdr.markForCheck();
      }, 600);
    } else {
      setTimeout(() => {
        this.chatMessages.push({ 
          sender: 'bot', 
          text: "Let me check all my notes and look through all active found listings... Sniffing out trails! 🔍🐾" 
        });
        this.cdr.markForCheck();
        this.executeSmartMatch();
      }, 600);
    }
  }

  executeSmartMatch() {
    const traits = this.collectedTraits;
    
    // Only look inside 'found' posts
    const foundOnlyPosts = this.allPosts.filter(p => p.postType === 'found');

    const scoredPosts = foundOnlyPosts.map(p => {
      let score = 0;
      let matchedCriteriaCount = 0;
      let totalQueriedCriteria = 0;

      const clean = (str: string) => (str || '').toLowerCase().trim();

      const extractNumber = (str: string): number | null => {
        const matches = str.match(/\d+(\.\d+)?/);
        return matches ? parseFloat(matches[0]) : null;
      };

      // Critical Requirement Validation: Species Match
      if (traits['species'] && traits['species'].trim()) {
        totalQueriedCriteria++;
        if (clean(p.species).includes(clean(traits['species']))) {
          score += 10;
          matchedCriteriaCount++;
        } else {
          return { post: p, score: -1, confidence: 0 };
        }
      }

      const checkTrait = (postFieldVal: any, traitKey: string, weight: number) => {
        const queryRaw = traits[traitKey];
        const queryVal = clean(queryRaw);
        if (!queryVal || queryVal === 'no' || queryVal === 'skip' || queryVal === 'unknown') return;

        totalQueriedCriteria++;
        
        const targetField = typeof postFieldVal === 'boolean' 
          ? (postFieldVal ? 'yes' : 'no') 
          : clean(postFieldVal);
          
        const targetDesc = clean(p.description);

        // SMART APPROXIMATE WEIGHTS
        if (traitKey === 'weightRange') {
          const userNum = extractNumber(queryRaw);
          const postNum = extractNumber(postFieldVal) || extractNumber(p.description);

          if (userNum !== null && postNum !== null) {
            const weightDifference = Math.abs(userNum - postNum);
            if (weightDifference <= 3) {
              score += weight; 
              matchedCriteriaCount++;
              return;
            }
          }
        }

        // STANDARD FALLBACK
        if (targetField.includes(queryVal)) {
          score += weight;
          matchedCriteriaCount++;
        } else if (targetDesc.includes(queryVal)) {
          score += (weight * 0.7);
          matchedCriteriaCount++;
        }
      };

      // Scan post data points
      checkTrait(p.breed, 'breed', 5);
      checkTrait(p.gender, 'gender', 4);
      checkTrait(p.lastSeenLocation, 'lastSeenLocation', 6);
      checkTrait(p.size, 'size', 3);
      checkTrait(p.pattern, 'pattern', 3);
      checkTrait(p.weightRange, 'weightRange', 4);    
      checkTrait(p.microchipped, 'microchipped', 5);  
      checkTrait(p.collarDetails, 'collarDetails', 4);
      checkTrait(p.distinguishingFeatures, 'distinguishingFeatures', 5);
      checkTrait(p.age, 'age', 3);

      // Colors intersection handler
      if (traits['colors'] && traits['colors'].trim()) {
        const searchColors = traits['colors'].toLowerCase().split(',').map(c => c.trim()).filter(c => c);
        if (searchColors.length > 0) {
          totalQueriedCriteria++;
          let colorMatches = 0;
          
          searchColors.forEach(color => {
            const inColorsArray = p.colors && p.colors.map(c => c.toLowerCase()).includes(color);
            const inDescription = clean(p.description).includes(color);
            
            if (inColorsArray || inDescription) {
              colorMatches++;
            }
          });

          if (colorMatches > 0) {
            score += (colorMatches * 3);
            matchedCriteriaCount++;
          }
        }
      }

      return {
        post: p,
        score: score,
        confidence: totalQueriedCriteria > 0 ? (matchedCriteriaCount / totalQueriedCriteria) : 0
      };
    });

    const finalMatches = scoredPosts
      .filter(item => item.score > 0 && item.confidence >= 0.2)
      .sort((a, b) => b.score - a.score)
      .map(item => item.post);

    setTimeout(() => {
      if (finalMatches.length > 0) {
        this.chatMessages.push({ 
          sender: 'bot', 
          text: `✨ **Good news!** I sniffed out **${finalMatches.length}** active found possibilities that look like your missing friend! Check out the middle feed. 🏡💖` 
        });
        this.posts = finalMatches;
      } else {
        this.chatMessages.push({ 
          sender: 'bot', 
          text: "I checked all active alerts, but I couldn't find a matching trail with those exact words yet. 😢 Let's look again! What **species** are we hunting for? 🐶🐱" 
        });
        
        // Reset full parameter map collection on memory overflow failure
        this.collectedTraits = {
          species: '', breed: '', age: '', gender: '', lastSeenLocation: '',
          size: '', colors: '', pattern: '', weightRange: '', microchipped: '',
          collarDetails: '', distinguishingFeatures: ''
        };
        this.currentStep = 0;
      }
      this.cdr.markForCheck();
    }, 1200);
  }
}