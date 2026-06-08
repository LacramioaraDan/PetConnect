import { Component, NgZone, signal, OnInit } from '@angular/core';
import { remult, UserInfo } from 'remult';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs'; 
import { User, UserRole } from '../shared/User'; 

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [FormsModule, HttpClientModule, RouterModule, CommonModule]
})
export class App implements OnInit {
  protected readonly title = signal('AdoptionApp');
  email = '';
  password = '';
  name = '';
  verificationDocumentUrl = '';
  
  // MODIFICAT: Permite 'sitter' direct sau extinde tipul dacă UserRole este strict definit în fișierul partajat
  role: UserRole | 'sitter' = 'user'; 
  address = '';
  phone = '';
  experience = '';

  isSignUp = false;
  forgotPasswordMode = false;
  resetMode = false; 
  resetToken = '';
  newPassword = '';
  

  remult = remult;
  fullUser?: User | null;

  constructor(private http: HttpClient, private zone: NgZone) {
    remult.apiClient.wrapMessageHandling = (handler) =>
      this.zone.run(() => handler());
  }

  async ngOnInit() {
    try {
      this.remult.user = await lastValueFrom(
        this.http.get<UserInfo>('/api/currentUser')
      );
      if (this.remult.user) {
        await this.fetchFullUser();
      }
    } catch (e) {}
  }


 async fetchFullUser() {
  try {
    if (this.remult.user) {
      const user = await this.remult.repo(User).findId(this.remult.user.id);
      
      // If 'user' is undefined, it means the account was deleted in the DB
      if (!user) {
        throw new Error("Account no longer exists");
      }
      
      this.fullUser = user;
    }
  } catch (e) {
    // 1. Clear the local user state
    this.remult.user = undefined;
    this.fullUser = null;
    
    // 2. Force the browser to refresh, which will redirect the user to the login screen
    // because remult.authenticated() will now be false.
    alert("Your account has been removed. You are being logged out.");
    window.location.reload(); 
  }
}

  async sendResetEmail() {
    try {
      const result = await User.sendResetEmail(this.email);
      alert(result);
      this.forgotPasswordMode = false;
      this.resetMode = true; 
    } catch (error: any) {
      alert(error.message);
    }
  }

  async finishReset() {
    try {
      const result = await User.resetPassword(this.resetToken, this.newPassword);
      alert(result);
      this.resetMode = false; 
    } catch (error: any) {
      alert(error.message);
    }
  }

  async signUp() {
    try {
      this.remult.user = await lastValueFrom(
        this.http.post<UserInfo>('/api/signUp', {
          email: this.email,
          password: this.password,
          name: this.name,
          role: this.role,
          address: this.address,
          phone: this.phone,
          experience: this.experience,
          // We include this to match the backend expectation
          verificationDocumentUrl: this.verificationDocumentUrl 
        })
      );
      
      await this.fetchFullUser();
      
      // Reset all form fields to clean the UI after successful registration
      this.email = '';
      this.password = '';
      this.name = '';
      this.role = 'user';
      this.address = '';
      this.phone = '';
      this.experience = '';
      this.verificationDocumentUrl = ''; // Reset the link field
      
      alert("Account created successfully!");
    } catch (e: any) {
      // Improved error reporting
      console.error("Sign up error:", e);
      alert(e.error?.message || "Sign up failed. Please check your inputs.");
    }
  }
}