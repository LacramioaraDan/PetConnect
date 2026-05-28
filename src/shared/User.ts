import { Allow, Entity, Fields, Validators, BackendMethod, remult } from "remult";

// Adăugăm "petsitter" în tipurile de roluri posibile în aplicație
export type UserRole = "user" | "shelter" | "petsitter" | "admin";

@Entity("users", {
  allowApiRead: Allow.authenticated,
  allowApiUpdate: Allow.authenticated,
  allowApiInsert: false, 
  allowApiDelete: Allow.authenticated 
})
export class User {
  @Fields.uuid()
  id = "";

  @Fields.string({
    validate: Validators.required
  })
  name = '';

  @Fields.string({
    validate: Validators.required
  })
  email = "";

  @Fields.string()
  description = ""; // Petsitterii își vor introduce descrierea/anunțul lor de profil aici!

  @Fields.string({
    includeInApi: false 
  })
  password = "";

  @Fields.string()
  imageUrl = '';

  @Fields.string({ includeInApi: false }) 
  resetToken = "";

  // --- TIPUL DE CONT (SHELTER / USER SIMPLU / PETSITTER) ---

  @Fields.string<User>({
    validate: (user) => {
      // Adăugăm "petsitter" în lista de validare
      if (user.role && !["user", "shelter", "petsitter", "admin"].includes(user.role)) {
        throw "Invalid role!";
      }
    }
  })
  role: UserRole = "user"; // Implicit, toată lumea este utilizator normal

  @Fields.string({ allowNull: true })
  address = ""; // Adăposturile își trec adresa, iar petsitterii pot trece orașul/zona aici

  @Fields.string({ allowNull: true })
  phone = ""; // Număr de telefon pentru contact rapid

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
        console.error("Full error object:", err);
      }
    }

    return "If an account exists for this email, a reset link has been sent.";
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
    
    console.log("OLD PASS IN DB:", user.password);
    console.log("NEW HASHED PASS:", hashedPassword);
    
    user.password = hashedPassword;
    user.resetToken = ""; 
    
    const savedUser = await userRepo.save(user);
    console.log("USER SAVED SUCCESSFULLY. NEW PASS STORED:", savedUser.password);

    return "Your password has been successfully updated!";
  }
}

declare module 'remult' {
  export interface UserInfo {
    imageUrl?: string;
    role?: UserRole; 
  }
}