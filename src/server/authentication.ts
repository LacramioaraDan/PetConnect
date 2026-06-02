import { remult } from "remult";
import express, { Router } from "express";
import "cookie-session";
import { User } from "../shared/User";
import * as bcrypt from "bcrypt";
import { api } from "./api";

export const authenticate = Router();

// Helper to notify the admin
async function sendAdminNotification(user: User) {
    const apiKey = process.env['RESEND_API_KEY'];
    const adminEmail = "your-admin-email@example.com"; // Replace with your actual admin email

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'PetConnect <no-reply@contactpetconnect.site>',
                to: adminEmail,
                subject: 'New Shelter Approval Required',
                html: `<h1>New Shelter Alert</h1>
                       <p>A new shelter <strong>${user.name}</strong> has registered.</p>
                       <p>Document URL: <a href="${user.verificationDocumentUrl}" target="_blank">View License Document</a></p>`
            })
        });
    } catch (err) {
        console.error("Failed to send admin notification email", err);
    }
}

// 1. SIGN UP
authenticate.post("/api/signUp", api.withRemult, async (req, res) => {
    // Extragem și noile câmpuri specifice trimise din formularul de înregistrare
    const { email, password, name, role, address, phone, description, verificationDocumentUrl } = req.body;
    try {
        const repo = remult.repo(User); 
        const existing = await repo.findFirst({ email });
        if (existing) return res.status(400).json({ message: "Email already taken" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Inserăm utilizatorul cu rolul selectat și setăm isVerified: false pentru securitate
        const newUser = await repo.insert({ 
            email, 
            password: hashedPassword, 
            name,
            imageUrl: "",
            role: role || "user",
            address: address || "",
            phone: phone || "",
            description: description || "",
            verificationDocumentUrl: verificationDocumentUrl || "",
            isVerified: false
        });

        // Notify admin if it's a shelter
        if (newUser.role === 'shelter') {
            await sendAdminNotification(newUser);
        }

        // Salvăm în sesiune ID-ul, Numele și ROLUL
        req.session!['user'] = { 
            id: newUser.id, 
            name: newUser.name, 
            role: newUser.role,
            isVerified: newUser.isVerified
        };
        
        return res.json(req.session!['user']);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

// 2. SIGN IN
authenticate.post("/api/signIn", api.withRemult, async (req, res) => {
    const { email, password } = req.body;
    try {
        const repo = remult.repo(User);
        const user = await repo.findFirst({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            // Adăugăm ROLUL și starea de verificare în sesiune
            req.session!['user'] = { 
                id: user.id, 
                name: user.name, 
                role: user.role,
                isVerified: user.isVerified
            };
            return res.json(req.session!['user']);
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error: any) {
        return res.status(500).json({ message: "An error occurred" });
    }
});

// 3. CURRENT USER
authenticate.get("/api/currentUser", (req, res) => {
    res.json(req.session!['user']);
});

// 4. SIGN OUT
authenticate.post("/api/signOut", (req, res) => {
    req.session!['user'] = null;
    res.json('Ok');
});

// 5. DELETE ACCOUNT
authenticate.delete("/api/deleteAccount", api.withRemult, async (req, res) => {
  try {
    const sessionUser = req.session!['user'];

    if (!sessionUser || !sessionUser.id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const userRepo = remult.repo(User);
    const userToDestroy = await userRepo.findId(sessionUser.id);

    if (!userToDestroy) {
      return res.status(404).json({ message: "User not found" });
    }

    await userRepo.delete(userToDestroy);
    req.session!['user'] = null;

    return res.json({ message: "Account deleted successfully" });

  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});