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

  // Lists of posts
  posts: LostAndFoundPost[] = [];
  allPosts: LostAndFoundPost[] = [];
  postRepo = remult.repo(LostAndFoundPost);
  
  editablePost: Partial<LostAndFoundPost> = {};

  // Filter Details
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

 // Modal State
  showModal = false;
  unSub: () => void = () => {};

  // Chatbot State
  currentStep = -1; 

  // Collected traits from the user for smart matching
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
    imageColorProfile: null
  };

  // Chatbot conversation steps
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

  // Chatbot conversation history
  chatMessages: { sender: 'user' | 'bot', text: string, imageUrl?: string }[] = [];
  userChatInput = '';

  // Logged-in user details
  fullUser: any;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  // Loads page data
  async ngOnInit() {
    this.fetchPosts();
    await this.fetchFullUserContext();
    this.initGreetingMessage();
  }

  // Cleans up subscriptions when the component is destroyed
  ngOnDestroy() { 
    if (this.unSub) this.unSub(); 
  }

  // Greeting message for the chatbot
  initGreetingMessage() {
    this.chatMessages = [
      { 
        sender: 'bot', 
        text: "Hello, I am Buddy, your virtual pet finder assistant! I can help you filter through posts to find your missing pet. We can fill out details step-by-step, or if you already made a lost post on our platform, I can grab those details instantly! Are you ready?" 
      }
    ];
  }

  // Resets the chatbot and collected traits to start a new search
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

  // Fetches the full user data for the logged-in user
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

  // Returns the existing lost post for the logged-in user
  getMyExistingLostPost(): LostAndFoundPost | null {
    if (!remult.user) return null;
    return this.allPosts.find(p => p.userId === remult.user?.id && p.postType === 'lost') || null;
  }

  // Uses the existing lost post data to make the smart match
  async useExistingPostData(post: LostAndFoundPost) {
    this.chatMessages.push({
      sender: 'user',
      text: `Please run a smart match scan using my existing post for my ${post.species}!`
    });
    this.cdr.markForCheck();

    this.chatMessages.push({
      sender: 'bot',
      text: `Got it! Extracting data about your lost <b>${post.species}</b>...`
    });
    this.cdr.markForCheck();

    // Completes the needed details with the existing post data
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

    // Extracting picture color profile for matching
    if (post.imageUrl) {
      try {
        this.collectedTraits['imageColorProfile'] = await this.getPictureColorProfile(post.imageUrl);
      } catch (e) {
        console.warn("Could not scan the image properly...", e);
      }
    }

    // Skips the chatbot steps and directly executes the smart match
    this.currentStep = this.chatSteps.length;
    
    setTimeout(() => {
      this.executeSmartMatch();
    }, 1000);
  }

  // Fetches all posts from the database
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

  // Resets all filters
  resetFilters() {
    this.filters = {
      species: '', gender: '', lastSeenLocation: '', postType: '',
      weightRange: '', microchipped: null, colors: '',
      size: '', breed: '', pattern: '', age: '', collarDetails: ''
    };
    this.applyFilters();
  }

  // Applies the current filters to the list of posts
  applyFilters() {
    this.posts = this.allPosts.filter(p => {
      const match = (val: string, filter: string) => 
        !filter || !filter.trim() || (val && val.toLowerCase().includes(filter.toLowerCase()));

      // Special handling for colors filtering, allowing multiple colors to be specified  
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

  // Opens the card for adding a new post
  openAddModal() { 
    this.editablePost = { 
      species: '', breed: '', age: '', gender: '', postType: 'lost',
      lastSeenLocation: '', collarDetails: '', microchipped: false,
      imageUrl: '', description: '', status: 'lost', size: '',
      pattern: '', weightRange: '', distinguishingFeatures: '', colors: [] 
    }; 
    this.showModal = true; 
  }

  // Opens the card for editing an existing post
  openEditModal(post: LostAndFoundPost) { 
    this.editablePost = { ...post }; 
    this.showModal = true; 
  }

  // Saves the post to the database
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

  // Deletes a post after user confirmation
  async deletePost(post: LostAndFoundPost) {
    if (!confirm(`Are you sure you want to delete this ${post.species} post?`)) return;
    try { 
      await this.postRepo.delete(post); 
    } catch (error: any) { 
      alert(error.message); 
    }
  }

  // Toggle menu for a specific post
  toggleMenu(post: LostAndFoundPost) {
    (post as any)._showMenu = !(post as any)._showMenu;
  }

  isMenuOpen(post: LostAndFoundPost): boolean {
    return !!(post as any)._showMenu;
  }

  // Handles file selection for image upload and converts it to a base64 URL
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editablePost.imageUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // Navigates to the chat page with the owner of a post
  startChat(userId: string) {
    if (!userId) {
      alert("Error: This post has no owner ID!");
      return;
    }
    this.router.navigate(['/messages', userId]);
  }

  // Extracts a color profile from an image (base64 or URL) for comparison
  private getPictureColorProfile(base64OrUrl: string): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      img.src = base64OrUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas failure");

        // Resize the image to a 16x16 pixel representation for color profiling
        canvas.width = 16;
        canvas.height = 16;
        // Draw the image onto the canvas and extract pixel data
        ctx.drawImage(img, 0, 0, 16, 16);

        const imgData = ctx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        const pixelProfiles: number[][] = [];

        // Extract RGB values for each pixel and store them in an array
        for (let i = 0; i < data.length; i += 4) {
          pixelProfiles.push([data[i], data[i+1], data[i+2]]);
        }
        resolve(pixelProfiles);
      };
      img.onerror = (err) => reject(err);
    });
  }

  // Compares the two pictures color profiles and returns a similarity score between 0 and 1
  private compareColorProfiles(profile1: number[][], profile2: number[][]): number {
    if (profile1.length !== profile2.length) return 0;
    let totalSimilarity = 0;

    // Calculate the Euclidean distance between each corresponding pixel's RGB values
    for (let i = 0; i < profile1.length; i++) {
      const rDiff = profile1[i][0] - profile2[i][0];
      const gDiff = profile1[i][1] - profile2[i][1];
      const bDiff = profile1[i][2] - profile2[i][2];
      const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
      // Normalize the distance to a similarity score between 0 and 1, where 1 is identical and 0 is completely different
      totalSimilarity += (1 - (distance / 442));
    }
    return totalSimilarity / profile1.length;
  }

  // Handles image selection in the chatbot and extracts its color profile for matching
  async onChatImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Read the image file and convert it to a base64 data URL
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const dataUrl = e.target.result;
      this.chatMessages.push({ sender: 'user', text: 'Sent a picture for scanning.', imageUrl: dataUrl });
      this.cdr.markForCheck();
      // Extract the color profile from the uploaded image and store it in the collected traits 
      try {
        this.collectedTraits['imageColorProfile'] = await this.getPictureColorProfile(dataUrl);
      } catch (err) {
        console.error(err);
      }
      // Move to the next step in the chatbot sequence 
      if (this.chatSteps[this.currentStep]?.field === 'imageFile') this.currentStep++;
      this.progressChatSequence();
    };
    // Start reading the file as a data URL
    reader.readAsDataURL(file);
  }

  // Chatbot conversation logic
  async sendMessage() {
    if (!this.userChatInput.trim()) return;

    const userText = this.userChatInput.trim();
    const lowerText = userText.toLowerCase();
    
    // Add the user's message to the chat history and clear the input field
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

    // Store the user's response for the current step and move to the next step
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

  // Progresses the chatbot conversation to the next step or executes the smart match if all steps are completed
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

  // Smart matching logic
  async executeSmartMatch() {
    const traits = this.collectedTraits;
    const foundOnlyPosts = this.allPosts.filter(p => p.postType === 'found');
    const scoredPosts: any[] = [];

    // Iterate through each found post and calculate a score based on how well they match the user's description
    for (const p of foundOnlyPosts) {
      let score = 0;
      let matchedCriteriaCount = 0;
      let totalQueriedCriteria = 0;

      // Helper functions for string cleaning and number extraction
      const clean = (str: string) => (str || '').toLowerCase().trim();
      const extractNumber = (str: string): number | null => {
        const matches = str.match(/\d+(\.\d+)?/);
        return matches ? parseFloat(matches[0]) : null;
      };

      // Image color profile matching logic
      if (traits['imageColorProfile'] && p.imageUrl) {
        totalQueriedCriteria += 3;
        try {
          const dbPostProfile = await this.getPictureColorProfile(p.imageUrl);
          const colorSimilarityScore = this.compareColorProfiles(traits['imageColorProfile'], dbPostProfile);
          // If the color similarity score is above a certain threshold, increase the score and matched criteria count
          if (colorSimilarityScore >= 0.70) {
            score += (colorSimilarityScore * 30); 
            matchedCriteriaCount += 3;
          }
        } catch (e) {
          console.warn(e);
        }
      }

      // Species matching logic
      if (traits['species'] && traits['species'].trim()) {
        totalQueriedCriteria++;
        if (clean(p.species).includes(clean(traits['species']))) {
          score += 10;
          matchedCriteriaCount++;
        } else {
          // If the species doesn't match, skip this post entirely as it's a critical criteria
          continue; 
        }
      }

      // Checking each trait and updating the score and matched criteria count accordingly
      const checkTrait = (postFieldVal: any, traitKey: string, weight: number) => {
        const queryRaw = traits[traitKey];
        const queryVal = clean(queryRaw);
        if (!queryVal || queryVal === 'no' || queryVal === 'skip' || queryVal === 'unknown') return;

        totalQueriedCriteria++;
        // For boolean fields like microchipped, convert to 'yes' or 'no' for comparison
        const targetField = typeof postFieldVal === 'boolean' ? (postFieldVal ? 'yes' : 'no') : clean(postFieldVal);
        // Clean the description for searching
        const targetDesc = clean(p.description);

        // If the database number is within 5 kilograms of what the user typed, count it as a match
        if (traitKey === 'weightRange') {
          const userNum = extractNumber(queryRaw);
          const postNum = extractNumber(postFieldVal) || extractNumber(p.description);
          if (userNum !== null && postNum !== null) {
            if (Math.abs(userNum - postNum) <= 5) {
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

      // Check each trait using the helper function
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

      // Special handling for colors, allowing multiple colors to be specified and matched
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
            // Give 3 points for each color word that is a match
            score += (colorMatches * 3);
            matchedCriteriaCount++;
          }
        }
      }

      // After evaluating all criteria, store the post along with its score and confidence level
      scoredPosts.push({ 
        post: p, 
        score: score,
        confidence: totalQueriedCriteria > 0 ? (matchedCriteriaCount / totalQueriedCriteria) : 0 
      });

    }

    // Filter out posts with low scores or low confidence, sort by score, and extract the final matching posts
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