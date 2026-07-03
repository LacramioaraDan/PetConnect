import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIBot } from '../../shared/AIBot';
import { Router } from '@angular/router';
import { remult } from 'remult';

// Define the structure of a chat message
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

// The PetAdvisor component manages the chat interface and interactions with the AI bot
export class PetAdvisor {
  messages: Message[] = [{ sender: 'bot', text: 'Hello! I am Buddy, your personal Pet Advisor. Answer a few quick questions about your lifestyle and I will help you find the perfect pet match for your home. Ready to start?' }];
  userInput = '';
  isLoading = false;
  currentQuestionIndex = -1;
  finalPetMatch?: string; 

  constructor(private router: Router) {}

  // Handles sending user messages and receiving responses from the AI bot
  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput;
    this.messages.push({ sender: 'user', text: userText });
    this.userInput = '';
    this.isLoading = true;

    this.scrollToBottom();

    // Simulate a delay to mimic the bot "thinking" before responding
    await new Promise(resolve => setTimeout(resolve, 800));

    // Attempt to process the user's answer and get a response from the AI bot
    try {
      const uniqueSessionId = remult.user?.id || "anonymous-guest-token";
      
      const response = await AIBot.processAnswer(uniqueSessionId, this.currentQuestionIndex, userText);
      
      // If a response is received, update the current question index and recommended species if applicable
      if (response) {
        this.currentQuestionIndex = response.index;
        
        if (response.recommendedSpecies) {
          this.finalPetMatch = response.recommendedSpecies;
        }

        this.messages.push({ 
          sender: 'bot', 
          text: response.question,
          recommendedSpecies: response.recommendedSpecies
        });

        this.scrollToBottom();
      }
    } catch (err) {
      this.messages.push({ sender: 'bot', text: 'Could you try that again?' });
    } finally {
      this.isLoading = false;
    }
  }

  // Scrolls the chat viewport to the bottom to show the latest messages
  scrollToBottom() {
    setTimeout(() => {

      const viewport = document.querySelector('.messages-viewport');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth' 
        });
      }
    }, 100);
  }

  // Navigates to the posts page with a query parameter for the recommended species
  navigateToPosts(species: string) {
    let searchToken = species;

    if (species === 'guinea_pig') searchToken = 'guinea';
    
    this.router.navigate(['/'], { 
      queryParams: { species: searchToken }
    });
  }
}