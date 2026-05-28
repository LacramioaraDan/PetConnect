import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIBot } from '../../shared/AIBot';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-pet-advisor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pet-advisor.html',
  styleUrl: './pet-advisor.css'
})
export class PetAdvisor {
  messages: Message[] = [
    { sender: 'bot', text: 'Hello! 🐾 I am Buddy, your AI Pet Care Advisor. Ask me anything about nutrition, grooming, training, or bringing a new pet home!' }
  ];
  userInput = '';
  isLoading = false;

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput;
    this.messages.push({ sender: 'user', text: userText });
    this.userInput = '';
    this.isLoading = true;

    try {
      const response = await AIBot.askPetBot(userText);
      this.messages.push({ sender: 'bot', text: response || 'I couldn\'t process that question.' });
    } catch (err) {
      this.messages.push({ sender: 'bot', text: 'System error. Try again shortly!' });
    } finally {
      this.isLoading = false;
    }
  }
}