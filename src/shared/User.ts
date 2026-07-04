import { Allow, Entity, Fields, Validators, BackendMethod, remult } from "remult";
import { Animal } from "./Animal";
import { LostAndFoundPost } from "./LostAndFoundPosts";
import { SittingPost } from "./SittingPosts";

// Defines the custom user category permissions allowed by the platform
export type UserRole = "user" | "shelter" | "petsitter" | "admin";

@Entity("users", {

  // Sets standard read, update, and delete access rules for authenticated accounts
  allowApiRead: Allow.authenticated,
  allowApiUpdate: Allow.authenticated,
  allowApiInsert: true, 
  allowApiDelete: Allow.authenticated 
})

// User Entity Fields
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

  // Password reset logic that generates security tokens and emails them to users
  @BackendMethod({ allowed: Allow.everyone })

  static async sendResetEmail(email: string) {
    const userRepo = remult.repo(User);
    const user = await userRepo.findFirst({ email });

    if (user) {

      // Creates a temporary alphanumeric string code for verification steps
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

        // Dispatches the compiled HTML layout directly through the third-party email service provider
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

  // Shelter verification logic that enables shelter accounts 
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

  // Shelter verification denial logic that rejects pending shelters and clears out their entry details
  @BackendMethod({ allowed: () => remult.user?.role === 'admin' })

  static async denyShelter(userId: string) {
    // Routes directly to account destruction steps since application access is being rejected
    await User.deleteUserAccount(userId);
    console.log(`Shelter with ID ${userId} has been denied access and their account has been deleted.`);
  }

  // User account deletion logic that deletes all records of that user account
  @BackendMethod({ allowed: Allow.authenticated })

  static async deleteUserAccount(userId: string) {
    const userRepo = remult.repo(User);
    const animalRepo = remult.repo(Animal);
    const lostRepo = remult.repo(LostAndFoundPost);
    const sittingRepo = remult.repo(SittingPost); 
    
    const user = await userRepo.findId(userId);
    if (!user) throw new Error("User not found");

    // Only allow account deletion if it's the account owner or an admin
    if (remult.user?.id !== userId && remult.user?.role !== 'admin') {
      throw new Error("Permission denied");
    }

    // Clean out adoption posts
    const usersAnimals = await animalRepo.find({ where: { userId } });
    for (const animal of usersAnimals) {
      await animalRepo.delete(animal);
    }

    // Clean out lost and found posts
    const usersLostPosts = await lostRepo.find({ where: { userId } });
    for (const post of usersLostPosts) {
      await lostRepo.delete(post);
    }

    // Clean out pet sitting posts
    const usersSittingPosts = await sittingRepo.find({ where: { userId } });
    for (const post of usersSittingPosts) {
      await sittingRepo.delete(post);
    }

    // Delete client login record
    await userRepo.delete(user);
    return "Account and all associated records deleted successfully";
  }

  // Verifies security tokens and overwrites old passwords
  @BackendMethod({ allowed: Allow.everyone })
  static async resetPassword(token: string, newPassword: string) {
    if (!token) throw new Error("Invalid token");
    
    const userRepo = remult.repo(User);
    const user = await userRepo.findFirst({ resetToken: token });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Dynamically imports encryption libraries to securely lock down the new credential text
    const libraryName = 'bcryptjs';
    const bcrypt = await import(/* @vite-ignore */ libraryName);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.resetToken = ""; 
    
    await userRepo.save(user);
    return "Your password has been successfully updated!";
  }
}

// Adds our custom details like user role, name picture or verification status to the default login profile card
declare module 'remult' {
  export interface UserInfo {
    id: string;
    name?: string;
    imageUrl?: string;
    role?: UserRole;
    isVerified?: boolean;
  }
}