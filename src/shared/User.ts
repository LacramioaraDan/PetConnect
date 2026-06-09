import { Allow, Entity, Fields, Validators, BackendMethod, remult } from "remult";
import { Animal } from "./Animal";
import { LostAndFoundPost } from "./LostAndFoundPosts";
import { SittingPost } from "./SittingPosts";

export type UserRole = "user" | "shelter" | "petsitter" | "admin";

@Entity("users", {
  allowApiRead: Allow.authenticated,
  allowApiUpdate: Allow.authenticated,
  allowApiInsert: true, 
  allowApiDelete: Allow.authenticated 
})
export class User {
  @Fields.uuid()
  id = "";

  @Fields.string({ validate: Validators.required })
  name = '';

  @Fields.string({ validate: Validators.required })
  email = "";

  @Fields.string()
  description = ""; 

  @Fields.string()
  experience = "";
  
  @Fields.string({ includeInApi: false })
  password = "";

  @Fields.string()
  imageUrl = '';

  @Fields.string({ includeInApi: false }) 
  resetToken = "";

  @Fields.string<User>({
    validate: (user) => {
      if (user.role && !["user", "shelter", "petsitter", "admin"].includes(user.role)) {
        throw "Invalid role!";
      }
    }
  })
  role: UserRole = "user";

  @Fields.string({ allowNull: true })
  address = ""; 

  @Fields.string({ allowNull: true })
  phone = ""; 

  @Fields.string()
  verificationDocumentUrl = "";

  @Fields.boolean()
  isVerified = false;

  /* --- BACKEND METHODS --- */

  @BackendMethod({ allowed: Allow.everyone })
  static async sendResetEmail(email: string) {
    const userRepo = remult.repo(User);
    const user = await userRepo.findFirst({ email });

    if (user) {
      user.resetToken = Math.random().toString(36).substring(2, 15);
      await userRepo.save(user);

      const serverEnv = (globalThis as any).process?.env || {};
      const apiKey = serverEnv.RESEND_API_KEY;

      console.log("=== RESEND DISPATCH START ===");
      console.log("Checking API Key presence:", !!apiKey);
      console.log("Attempting to send reset email to:", email);

      const emailHtml = `
        <div style="font-family: sans-serif; text-align: center; color: #8b2e8b;">
          <h1>Password Reset Request</h1>
          <p>You requested a password reset for your PetConnect account.</p>
          <div style="background: #fdf2f8; padding: 20px; border-radius: 10px; display: inline-block; margin: 20px 0;">
            <p style="font-size: 0.9rem; margin: 0;">Your Reset Token is:</p>
            <h2 style="letter-spacing: 5px; font-size: 2rem; margin: 10px 0;">${user.resetToken}</h2>
          </div>
          <p>Copy this token and paste it into the app to choose a new password.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #666;">If you didn't request this, you can ignore this email.</p>
        </div>
      `;

      try {
        const response = await (globalThis as any).fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'PetConnect <no-reply@contactpetconnect.site>',
            to: email, 
            subject: 'Reset Your PetConnect Password',
            html: emailHtml
          })
        });

        const status = response.status;
        const data = await response.json();
        console.log(`=== RESEND API RESPONSE (Status ${status}) ===`, data);
      } catch (err: any) {
        console.error("=== RESEND HTTP FAILURE ===");
        console.error("Error message:", err?.message || err);
      }
    }

    return "If an account exists for this email, a reset link has been sent.";
  }

  @BackendMethod({ allowed: () => remult.user?.role === 'admin' })
  static async approveShelter(userId: string) {
    const userRepo = remult.repo(User);
    const user = await userRepo.findId(userId);
    if (user) {
      user.isVerified = true;
      await userRepo.save(user);
      console.log("Database updated: isVerified is now true for", user.name);
    } else {
      console.error("User not found!");
    }
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async deleteUserAccount(userId: string) {
    const userRepo = remult.repo(User);
    const animalRepo = remult.repo(Animal);
    const lostRepo = remult.repo(LostAndFoundPost);
    const sittingRepo = remult.repo(SittingPost); // Target repository assigned
    
    const user = await userRepo.findId(userId);
    if (!user) throw new Error("User not found");

    // SECURITY CHECK: Only allow if it's the account owner or an admin
    if (remult.user?.id !== userId && remult.user?.role !== 'admin') {
      throw new Error("Permission denied");
    }

    // 1. Clean out standard listings/adoption posts
    const usersAnimals = await animalRepo.find({ where: { userId } });
    for (const animal of usersAnimals) {
      await animalRepo.delete(animal);
    }

    // 2. Clean out lost and found posts
    const usersLostPosts = await lostRepo.find({ where: { userId } });
    for (const post of usersLostPosts) {
      await lostRepo.delete(post);
    }

    // 3. Clean out all pet sitting offers/requests
    const usersSittingPosts = await sittingRepo.find({ where: { userId } });
    for (const post of usersSittingPosts) {
      await sittingRepo.delete(post);
    }

    // 4. Finally drop core client login record
    await userRepo.delete(user);
    return "Account and all associated records deleted successfully";
  }

  @BackendMethod({ allowed: Allow.everyone })
  static async resetPassword(token: string, newPassword: string) {
    if (!token) throw new Error("Invalid token");
    
    const userRepo = remult.repo(User);
    const user = await userRepo.findFirst({ resetToken: token });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const libraryName = 'bcryptjs';
    const bcrypt = await import(/* @vite-ignore */ libraryName);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.resetToken = ""; 
    
    await userRepo.save(user);
    return "Your password has been successfully updated!";
  }
}

declare module 'remult' {
  export interface UserInfo {
    id: string;
    name?: string;
    imageUrl?: string;
    role?: UserRole;
    isVerified?: boolean;
  }
}