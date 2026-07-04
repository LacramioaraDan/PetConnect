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

  // Application titles and form storage fields for user typed inputs
  protected readonly title = signal('AdoptionApp');
  email = '';
  password = '';
  name = '';
  verificationDocumentUrl = '';
  
  // Default values and variables for custom registration fields
  role: UserRole | 'sitter' = 'user'; 
  address = '';
  phone = '';
  experience = '';

  // True/False toggles to switch between login, signup, and reset screens
  isSignUp = false;
  forgotPasswordMode = false;
  resetMode = false; 
  resetToken = '';
  newPassword = '';
  
  // Storage variables to hold logged-in session data
  remult = remult;
  fullUser?: User | null;

  // Constructor setup to wrap database messages nicely inside Angular
  constructor(private http: HttpClient, private zone: NgZone) {
    remult.apiClient.wrapMessageHandling = (handler) =>
      this.zone.run(() => handler());
  }

  // Runs automatically on start to check if the user is already logged in
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

  // Grabs the detailed profile details or kicks out users whose accounts were deleted
  async fetchFullUser() {
    try {
      if (this.remult.user) {
        const user = await this.remult.repo(User).findId(this.remult.user.id);
        
        if (!user) {
          throw new Error("Account no longer exists");
        }
        
        this.fullUser = user;
      }
    } catch (e) {
      
      this.remult.user = undefined;
      this.fullUser = null;
      
      alert("Your account has been removed. You are being logged out.");
      window.location.reload(); 
    }
  }

  // Submits the typed email and password to log the user into the app
  async signIn() {
    try {
      this.remult.user = await lastValueFrom(
        this.http.post<UserInfo>('/api/signIn', {
          email: this.email,
          password: this.password
        })
      );
      await this.fetchFullUser();
      this.email = '';
      this.password = ''; 
    } catch (e: any) {
      alert(e.error?.message || "Sign in failed");
    }
  }

  // Sends a password recovery security token code to the user's email
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

  // Submits the received security code along with a chosen new password
  async finishReset() {
    try {
      const result = await User.resetPassword(this.resetToken, this.newPassword);
      alert(result);
      this.resetMode = false; 
    } catch (error: any) {
      alert(error.message);
    }
  }

  // Creates a brand new account and empties all form fields when successful
  async signUp() {

    // Sends all the typed-in form data to the server to create the account
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
          verificationDocumentUrl: this.verificationDocumentUrl 
        })
      );
      
      // Grabs the newly created user's complete profile data from the database
      await this.fetchFullUser();
      
      // Clears out all the text input boxes on the screen so they are empty again
      this.email = '';
      this.password = '';
      this.name = '';
      this.role = 'user';
      this.address = '';
      this.phone = '';
      this.experience = '';
      this.verificationDocumentUrl = '';
      
      alert("Account created successfully!");
    } catch (e: any) {
      console.error("Sign up error:", e);
      alert(e.error?.message || "Sign up failed. Please check your inputs.");
    }
  }
}