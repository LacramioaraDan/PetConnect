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
  
  // Variabile noi pentru gestionarea adăposturilor la înregistrare
  role: UserRole = 'user'; 
  address = '';
  phone = '';

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
    if (this.remult.user) {
      this.fullUser = await this.remult.repo(User).findId(this.remult.user.id);
    }
  }

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
          role: this.role,        // <--- Trimitem rolul selectat (user / shelter)
          address: this.address,  // <--- Trimitem adresa (completată doar dacă e shelter)
          phone: this.phone       // <--- Trimitem telefonul
        })
      );
      await this.fetchFullUser();
      
      // Resetăm toate câmpurile formularului
      this.email = '';
      this.password = '';
      this.name = '';
      this.role = 'user';
      this.address = '';
      this.phone = '';
    } catch (e: any) {
      alert(e.error?.message || "Sign up failed");
    }
  }
}