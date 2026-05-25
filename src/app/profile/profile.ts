import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { remult } from 'remult';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { User } from '../../shared/User';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  remult = remult;
  userRepo = remult.repo(User);
  currentUser?: User | null;

  isEditing = false;

  constructor(private http: HttpClient, private zone: NgZone) {
    // This fix handles updates coming back from the Server
    remult.apiClient.wrapMessageHandling = (handler) =>
      this.zone.run(() => handler());
  }

  async ngOnInit() {
    if (remult.user) {
      this.currentUser = await this.userRepo.findId(remult.user.id);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // This fix handles the UI update for the local image preview
        this.zone.run(() => {
          if (this.currentUser) {
            this.currentUser.imageUrl = e.target.result;
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfile() {
    try {
      if (this.currentUser) {
        const savedUser = await this.userRepo.save(this.currentUser as User); 
        
        // Update the global session object so the Navbar sees the new image immediately
        if (remult.user) {
          remult.user.imageUrl = savedUser.imageUrl;
          remult.user.name = savedUser.name;
        }

        alert("Profile updated successfully!");
      }
      } catch (error: any) {
        alert(error.message || "Failed to save profile");
    }
  }

  async signOut() {
    try {
      await lastValueFrom(this.http.post('/api/signOut', {}));
      this.remult.user = undefined;
      window.location.href = "/";
    } catch (e: any) {
      console.error("Sign out failed", e);
    }
  }

  async deleteAccount() {
    if (confirm("Are you sure? This will permanently delete your account.")) {
      try {
        await lastValueFrom(this.http.delete('/api/deleteAccount'));
        this.remult.user = undefined;
        alert("Your account has been deleted.");
        window.location.href = "/"; 
      } catch (e: any) {
        alert(e.error?.message || "Delete failed");
      }
    }
  }

  async cancelEdit() {
    this.isEditing = false;
    if (remult.user) {
      this.currentUser = await this.userRepo.findId(remult.user.id);
    }
  }
}