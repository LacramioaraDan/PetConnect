import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIBot } from '../../shared/AIBot';

interface Message { sender: 'user' | 'bot'; text: string; }

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
  currentQuestionIndex = -1; // Starts at -1 so first increment makes it 0

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput;
    this.messages.push({ sender: 'user', text: userText });
    this.userInput = '';
    this.isLoading = true;

    // Simulate "thinking" time for a natural feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await AIBot.processAnswer("user123", this.currentQuestionIndex, userText);
      
      if (response) {
        this.currentQuestionIndex = response.index;
        // The bot now uses the natural text from our CONVERSATIONAL_QUESTIONS array
        this.messages.push({ sender: 'bot', text: response.question });
      }
    } catch (err) {
      this.messages.push({ sender: 'bot', text: 'I hit a snag! Could you try that again?' });
    } finally {
      this.isLoading = false;
    }
  }
}