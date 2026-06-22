import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { LostAndFoundPost } from '../../shared/LostAndFoundPosts';
import { User } from '../../shared/User'; 
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

  collectedTraits: { [key: string]: any } = {
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
    distinguishingFeatures: '',
    imageColorProfile: null // Stores the 16x16 spatial RGB array data of the animal picture
  };

  chatSteps = [
    { field: 'species', question: "What <b>species</b> of animal are we looking for? (e.g., Dog, Cat, Rabbit)" },
    { field: 'imageFile', question: "Please <b>upload a photo</b> of your pet using the + button below! Or type 'skip' if you don't have one available." },
    { field: 'breed', question: "Do you know their <b>breed</b>? If you're not sure, just type 'no' or 'unknown'." },
    { field: 'age', question: "What <b>age group</b> do they belong to? (e.g., baby, junior, adult, senior)" },
    { field: 'gender', question: "Are they <b>Male</b> or <b>Female</b>?" },
    { field: 'lastSeenLocation', question: "What <b>city or area</b> were they last seen in?" },
    { field: 'size', question: "What is their <b>size scale</b>? (e.g., Small, Medium, Large)" },
    { field: 'weightRange', question: "What is their approximate <b>weight range</b>? (e.g., 5-10 kg)" },
    { field: 'microchipped', question: "Is your pet <b>microchipped</b>?" },
    { field: 'colors', question: "What <b>colors</b> does your pet have in their fur? You can add multiple colors (e.g., Brown, White)." },
    { field: 'pattern', question: "Do they have a specific <b>pattern</b>? (e.g., Spotted, Brindle, Solid, Calico)" },
    { field: 'collarDetails', question: "Were they wearing a <b>collar</b>? If yes, please describe it!" },
    { field: 'distinguishingFeatures', question: "Do they have any <b>distinguishing features</b>? (e.g., white socks on paws, torn left ear)" }
  ];

  chatMessages: { sender: 'user' | 'bot', text: string, imageUrl?: string }[] = [];
  userChatInput = '';

  // Core authenticated logging profile context
  fullUser: any;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  async ngOnInit() {
    this.fetchPosts();
    await this.fetchFullUserContext();
    this.initGreetingMessage();
  }

  ngOnDestroy() { 
    if (this.unSub) this.unSub(); 
  }

  initGreetingMessage() {
    this.chatMessages = [
      { 
        sender: 'bot', 
        text: "Hello, I am Buddy, your virtual pet finder assistant! I can help you filter through posts to find your missing pet. We can fill out details step-by-step, or if you already made a lost post on our platform, I can grab those details instantly! Are you ready?" 
      }
    ];
  }

  // --- Wipes Chat Engine back to Square One ---
  resetChat() {
    this.currentStep = -1;
    this.userChatInput = '';
    this.collectedTraits = {
      species: '', breed: '', age: '', gender: '', lastSeenLocation: '',
      size: '', colors: '', pattern: '', weightRange: '', microchipped: '',
      collarDetails: '', distinguishingFeatures: '', imageColorProfile: null
    };
    this.initGreetingMessage();
    this.fetchPosts(); 
    this.cdr.markForCheck();
  }

  async fetchFullUserContext() {
    if (remult.user) {
      try {
        this.fullUser = await remult.repo(User).findId(remult.user.id);
        this.cdr.markForCheck();
      } catch (error) {
        console.error("Could not load full user profile context details:", error);
      }
    }
  }

  // --- Grabs the logged-in user's existing active 'lost' post details ---
  getMyExistingLostPost(): LostAndFoundPost | null {
    if (!remult.user) return null;
    return this.allPosts.find(p => p.userId === remult.user?.id && p.postType === 'lost') || null;
  }

  // --- Automatically feeds post attributes into the chatbot matching grid ---
  async useExistingPostData(post: LostAndFoundPost) {
    this.chatMessages.push({
      sender: 'user',
      text: `🤖 Please run a smart match scan using my existing post for my ${post.species}!`
    });
    this.cdr.markForCheck();

    this.chatMessages.push({
      sender: 'bot',
      text: `Got it! Extracting data about your lost <b>${post.species}</b>...`
    });
    this.cdr.markForCheck();

    this.collectedTraits['species'] = post.species || '';
    this.collectedTraits['breed'] = post.breed || '';
    this.collectedTraits['age'] = post.age || '';
    this.collectedTraits['gender'] = post.gender || '';
    this.collectedTraits['lastSeenLocation'] = post.lastSeenLocation || '';
    this.collectedTraits['size'] = post.size || '';
    this.collectedTraits['pattern'] = post.pattern || '';
    this.collectedTraits['weightRange'] = post.weightRange || '';
    this.collectedTraits['microchipped'] = post.microchipped ? 'yes' : 'no';
    this.collectedTraits['collarDetails'] = post.collarDetails || '';
    this.collectedTraits['distinguishingFeatures'] = post.distinguishingFeatures || '';
    this.collectedTraits['colors'] = post.colors ? post.colors.join(', ') : '';

    if (post.imageUrl) {
      try {
        this.collectedTraits['imageColorProfile'] = await this.getPictureColorProfile(post.imageUrl);
      } catch (e) {
        console.warn("Could not scan the image properly...", e);
      }
    }

    this.currentStep = this.chatSteps.length;
    
    setTimeout(() => {
      this.executeSmartMatch();
    }, 1000);
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
          .map((c: string) => c.trim())
          .every((color: string) => p.colors.map((c: string) => c.toLowerCase()).includes(color)));

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
      species: '', breed: '', age: '', gender: '', postType: 'lost',
      lastSeenLocation: '', collarDetails: '', microchipped: false,
      imageUrl: '', description: '', status: 'lost', size: '',
      pattern: '', weightRange: '', distinguishingFeatures: '', colors: [] 
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

  // --- HTML5 Canvas Color Profiler Engine ---
  private getPictureColorProfile(base64OrUrl: string): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      img.src = base64OrUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas failure");

        canvas.width = 16;
        canvas.height = 16;
        ctx.drawImage(img, 0, 0, 16, 16);

        const imgData = ctx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        const pixelProfiles: number[][] = [];

        for (let i = 0; i < data.length; i += 4) {
          pixelProfiles.push([data[i], data[i+1], data[i+2]]);
        }
        resolve(pixelProfiles);
      };
      img.onerror = (err) => reject(err);
    });
  }

  private compareColorProfiles(profile1: number[][], profile2: number[][]): number {
    if (profile1.length !== profile2.length) return 0;
    let totalSimilarity = 0;
    for (let i = 0; i < profile1.length; i++) {
      const rDiff = profile1[i][0] - profile2[i][0];
      const gDiff = profile1[i][1] - profile2[i][1];
      const bDiff = profile1[i][2] - profile2[i][2];
      const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
      totalSimilarity += (1 - (distance / 442));
    }
    return totalSimilarity / profile1.length;
  }

  async onChatImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const dataUrl = e.target.result;
      this.chatMessages.push({ sender: 'user', text: 'Sent a picture for scanning.', imageUrl: dataUrl });
      this.cdr.markForCheck();
      try {
        this.collectedTraits['imageColorProfile'] = await this.getPictureColorProfile(dataUrl);
      } catch (err) {
        console.error(err);
      }
      if (this.chatSteps[this.currentStep]?.field === 'imageFile') this.currentStep++;
      this.progressChatSequence();
    };
    reader.readAsDataURL(file);
  }

  // --- Step-by-Step Chat Bot Logic ---
  async sendMessage() {
    if (!this.userChatInput.trim()) return;

    const userText = this.userChatInput.trim();
    const lowerText = userText.toLowerCase();
    
    this.chatMessages.push({ sender: 'user', text: userText });
    this.userChatInput = '';
    this.cdr.markForCheck();

    if (this.currentStep === -1) {
      this.currentStep = 0; 
      setTimeout(() => {
        this.chatMessages.push({ sender: 'bot', text: `Let's do it!<br><br>${this.chatSteps[0].question}` });
        this.cdr.markForCheck();
      }, 600);
      return; 
    }

    if (this.currentStep < this.chatSteps.length) {
      const currentField = this.chatSteps[this.currentStep].field;
      if (lowerText === 'no' || lowerText === 'skip' || lowerText === 'unknown') {
        this.collectedTraits[currentField] = '';
      } else {
        this.collectedTraits[currentField] = userText;
      }
      this.currentStep++;
    }
    this.progressChatSequence();
  }

  progressChatSequence() {
    if (this.currentStep < this.chatSteps.length) {
      setTimeout(() => {
        this.chatMessages.push({ sender: 'bot', text: this.chatSteps[this.currentStep].question });
        this.cdr.markForCheck();
      }, 600);
    } else {
      setTimeout(() => {
        this.chatMessages.push({ sender: 'bot', text: "Analyzing your description across all active found posts..." });
        this.cdr.markForCheck();
        this.executeSmartMatch();
      }, 600);
    }
  }

  async executeSmartMatch() {
    const traits = this.collectedTraits;
    const foundOnlyPosts = this.allPosts.filter(p => p.postType === 'found');
    const scoredPosts: any[] = [];

    for (const p of foundOnlyPosts) {
      let score = 0;
      let matchedCriteriaCount = 0;
      let totalQueriedCriteria = 0;

      const clean = (str: string) => (str || '').toLowerCase().trim();
      const extractNumber = (str: string): number | null => {
        const matches = str.match(/\d+(\.\d+)?/);
        return matches ? parseFloat(matches[0]) : null;
      };

      // --- ADVANCED METRIC: RGB COAT COLOR MATCHING SYSTEM ---
      if (traits['imageColorProfile'] && p.imageUrl) {
        totalQueriedCriteria += 3;
        try {
          const dbPostProfile = await this.getPictureColorProfile(p.imageUrl);
          const colorSimilarityScore = this.compareColorProfiles(traits['imageColorProfile'], dbPostProfile);
          if (colorSimilarityScore >= 0.70) {
            score += (colorSimilarityScore * 30); 
            matchedCriteriaCount += 3;
          }
        } catch (e) {
          console.warn(e);
        }
      }

      if (traits['species'] && traits['species'].trim()) {
        totalQueriedCriteria++;
        if (clean(p.species).includes(clean(traits['species']))) {
          score += 10;
          matchedCriteriaCount++;
        } else {
          continue; 
        }
      }

      const checkTrait = (postFieldVal: any, traitKey: string, weight: number) => {
        const queryRaw = traits[traitKey];
        const queryVal = clean(queryRaw);
        if (!queryVal || queryVal === 'no' || queryVal === 'skip' || queryVal === 'unknown') return;

        totalQueriedCriteria++;
        const targetField = typeof postFieldVal === 'boolean' ? (postFieldVal ? 'yes' : 'no') : clean(postFieldVal);
        const targetDesc = clean(p.description);

        if (traitKey === 'weightRange') {
          const userNum = extractNumber(queryRaw);
          const postNum = extractNumber(postFieldVal) || extractNumber(p.description);
          if (userNum !== null && postNum !== null) {
            if (Math.abs(userNum - postNum) <= 3) {
              score += weight; 
              matchedCriteriaCount++;
              return;
            }
          }
        }

        if (targetField.includes(queryVal)) {
          score += weight;
          matchedCriteriaCount++;
        } else if (targetDesc.includes(queryVal)) {
          score += (weight * 0.7);
          matchedCriteriaCount++;
        }
      };

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

      if (traits['colors'] && traits['colors'].trim()) {
        const searchColors = (traits['colors'] as string).toLowerCase().split(',').map((c: string) => c.trim()).filter((c: string) => !!c);
        if (searchColors.length > 0) {
          totalQueriedCriteria++;
          let colorMatches = 0;
          searchColors.forEach((color: string) => {
            const inColorsArray = p.colors && p.colors.map((c: string) => c.toLowerCase()).includes(color);
            const inDescription = clean(p.description).includes(color);
            if (inColorsArray || inDescription) colorMatches++;
          });
          if (colorMatches > 0) {
            score += (colorMatches * 3);
            matchedCriteriaCount++;
          }
        }
      }

      scoredPosts.push({ post: p, score: score, confidence: totalQueriedCriteria > 0 ? (matchedCriteriaCount / totalQueriedCriteria) : 0 });
    }

    const finalMatches = scoredPosts
      .filter(item => item.score > 0 && item.confidence >= 0.25)
      .sort((a, b) => b.score - a.score)
      .map(item => item.post);

    setTimeout(() => {
      if (finalMatches.length > 0) {
        this.chatMessages.push({ sender: 'bot', text: `<b>Good news!</b> I evaluated the properties of your post records. I found <b>${finalMatches.length}</b> highly probable matches in the database!` });
        this.posts = finalMatches;
      } else {
        this.chatMessages.push({ sender: 'bot', text: "I finished scanning the database, but couldn't find an exact matching pattern in the records yet. Feel free to use the reset button to try again if needed!" });
      }
      this.cdr.markForCheck();
    }, 1200);
  }
}