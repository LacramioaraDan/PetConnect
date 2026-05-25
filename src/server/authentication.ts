import { remult } from "remult";
import express, { Router } from "express";
import "cookie-session";
import { User } from "../shared/User";
import * as bcrypt from "bcrypt";
import { api } from "./api";

export const authenticate = Router();

// 1. SIGN UP
authenticate.post("/api/signUp", api.withRemult, async (req, res) => {
    // Extragem și noile câmpuri specifice trimise din formularul de înregistrare
    const { email, password, name, role, address, phone, description } = req.body;
    try {
        const repo = remult.repo(User); 
        const existing = await repo.findFirst({ email });
        if (existing) return res.status(400).json({ message: "Email already taken" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Inserăm utilizatorul cu rolul selectat (implicit 'user' dacă frontend-ul nu trimite nimic)
        const newUser = await repo.insert({ 
            email, 
            password: hashedPassword, 
            name,
            imageUrl: "",
            role: role || "user",
            address: address || "",
            phone: phone || "",
            description: description || ""
        });

        // Salvăm în sesiune ID-ul, Numele și ROLUL (păstrează cookie-ul mic și sigur!)
        req.session!['user'] = { 
            id: newUser.id, 
            name: newUser.name, 
            role: newUser.role 
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
            // Adăugăm ROLUL din baza de date în sesiune la logare
            req.session!['user'] = { 
                id: user.id, 
                name: user.name, 
                role: user.role 
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