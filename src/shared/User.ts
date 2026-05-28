import { Allow, Entity, Fields, Validators, BackendMethod, remult } from "remult";

// Definim tipurile de roluri posibile în aplicație
export type UserRole = "user" | "shelter" | "admin";

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
  description = "";

  @Fields.string({
    includeInApi: false 
  })
  password = "";

  @Fields.string()
  imageUrl = '';

  @Fields.string({ includeInApi: false }) 
  resetToken = "";

  // --- CÂMPURI NOI PENTRU TIPUL DE CONT (SHELTER / USER SIMPLU) ---

  @Fields.string<User>({
    validate: (user) => {
      if (user.role && !["user", "shelter", "admin"].includes(user.role)) {
        throw "Rol invalid!";
      }
    }
  })
  role: UserRole = "user"; // Implicit, toată lumea este utilizator normal

  @Fields.string({ allowNull: true })
  address = ""; // Adăposturile își vor putea trece adresa fizică aici

  @Fields.string({ allowNull: true })
  phone = ""; // Număr de telefon opțional pentru contact rapid

  /* --- BACKEND METHODS --- */

 @BackendMethod({ allowed: Allow.everyone })
  static async sendResetEmail(email: string) {
    const userRepo = remult.repo(User);
    const user = await userRepo.findFirst({ email });

    if (user) {
      // 1. Generăm token-ul unic (rămâne strict pe server/baza de date)
      user.resetToken = Math.random().toString(36).substring(2, 15);
      await userRepo.save(user);

      // 2. Extregem cheia API din mediul securizat Railway
      const serverEnv = (globalThis as any).process?.env || {};
      const apiKey = serverEnv.RESEND_API_KEY;

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

      // 3. 🔥 SOLUȚIA SALVATOARE: Trimitem mailul printr-un apel HTTP (port deschis pe Railway!)
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Pe contul gratuit Resend, poți trimite doar către adresa ta cu care ai făcut contul!
            // Schimbă temporar în "to: 'emailul_tau_cu_care_ai_facut_contul_resend'" pentru teste,
            // sau lasă variabila "email" dacă testezi fix cu contul tău.
            from: 'PetConnect <onboarding@resend.dev>',
            to: email, 
            subject: 'Reset Your PetConnect Password',
            html: emailHtml
          })
        });

        const data = await response.json();
        console.log("Resend API Delivery Response:", data);
      } catch (err) {
        console.error("Resend API communication failed:", err);
      }
    }

    // 4. Utilizatorul (sau atacatorul) primește doar acest text generic în browser. 
    // Nu are cum să vadă token-ul! Contul tău e complet în siguranță.
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