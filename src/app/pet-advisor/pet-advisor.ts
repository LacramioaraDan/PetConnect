import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIBot } from '../../shared/AIBot';
import { Router } from '@angular/router';

interface Message { 
  sender: 'user' | 'bot'; 
  text: string; 
  recommendedSpecies?: string; 
}

@Component({
  selector: 'app-pet-advisor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pet-advisor.html',
  styleUrl: './pet-advisor.css'
})
export class PetAdvisor {
  messages: Message[] = [{ sender: 'bot', text: 'Hello! I am Buddy, your personal Pet Advisor. Answer a few quick questions about your lifestyle and I will help you find the perfect pet match for your home. Ready to start?' }];
  userInput = '';
  isLoading = false;
  currentQuestionIndex = -1;
  finalPetMatch?: string; // <--- Tracks the result globally across the chat session

  constructor(private router: Router) {}

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput;
    this.messages.push({ sender: 'user', text: userText });
    this.userInput = '';
    this.isLoading = true;

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await AIBot.processAnswer("user123", this.currentQuestionIndex, userText);
      
      if (response) {
        this.currentQuestionIndex = response.index;
        
        // Save the recommendation to our global tracker variable if it arrives
        if (response.recommendedSpecies) {
          this.finalPetMatch = response.recommendedSpecies;
        }

        this.messages.push({ 
          sender: 'bot', 
          text: response.question,
          recommendedSpecies: response.recommendedSpecies
        });
      }
    } catch (err) {
      this.messages.push({ sender: 'bot', text: 'I hit a snag! Could you try that again?' });
    } finally {
      this.isLoading = false;
    }
  }

  navigateToPosts(species: string) {
    let searchToken = species;

    // Normalization Map: Translates backend profile keys into your site's data keywords
    if (species === 'guinea_pig') searchToken = 'guinea';
    
    // FIXED: Changed '/Posts' to '/posts' (lowercase) or use an empty string array if it is your home path
    this.router.navigate(['/'], { 
      queryParams: { species: searchToken }
    });
  }
}