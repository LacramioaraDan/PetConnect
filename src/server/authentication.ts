import { remult } from "remult";
import express, { Router } from "express";
import "cookie-session";
import { User } from "../shared/User";
import * as bcrypt from "bcrypt";
import { api } from "./api";

// Sets up the express router tool to handle login URLs
export const authenticate = Router();

// 1. Sign up function
authenticate.post("/api/signUp", api.withRemult, async (req, res) => {
    
    // Unpacks all the info typed into the registration form
    const { email, password, name, role, address, phone, description, experience, verificationDocumentUrl } = req.body;
    
    try {
        const repo = remult.repo(User); 

        // Checks the database to see if someone already uses this email
        const existing = await repo.findFirst({ email });
        if (existing) return res.status(400).json({ message: "Email already taken" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Saves the brand new user with all their info into the database table
        const newUser = await repo.insert({ 
            email, 
            password: hashedPassword, 
            name,
            imageUrl: "",
            role: role || "user",
            address: address || "",
            phone: phone || "",
            description: description || "",
            experience: experience || "",
            verificationDocumentUrl: verificationDocumentUrl || "",
            isVerified: false
        });

        // Creates a secure login cookie card so the website remembers who they are
        req.session!['user'] = { 
            id: newUser.id, 
            name: newUser.name, 
            role: newUser.role,
            isVerified: newUser.isVerified
        };
        
        // Sends the logged-in session data back to the user's browser
        return res.json(req.session!['user']);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
});

// Sign in function
authenticate.post("/api/signIn", api.withRemult, async (req, res) => {
    
    // Grabs the typed email and password from the login screen
    const { email, password } = req.body;
    try {
        const repo = remult.repo(User);

        // Searches the database to find a user profile matching this email
        const user = await repo.findFirst({ email });

        // Compares the typed password against the scrambled database password
        if (user && await bcrypt.compare(password, user.password)) {

            // Creates a secure login cookie card since the password was correct
            req.session!['user'] = { 
                id: user.id, 
                name: user.name, 
                role: user.role,
                isVerified: user.isVerified
            };
            return res.json(req.session!['user']);
        } else {
            // Stops them if the email doesn't exist or the password is wrong
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error: any) {
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Gets the current user
authenticate.get("/api/currentUser", (req, res) => {
    res.json(req.session!['user']);
});

// Logs the user out
authenticate.post("/api/signOut", (req, res) => {
    req.session!['user'] = null;
    res.json('Ok');
});

// Delete account function
authenticate.delete("/api/deleteAccount", api.withRemult, async (req, res) => {
  try {

    // Checks the login card to see which user is asking to delete their account
    const sessionUser = req.session!['user'];

    // If there is no active login card, reject the request instantly
    if (!sessionUser || !sessionUser.id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const userRepo = remult.repo(User);

    // Looks up the target user's profile ID inside the database
    const userToDestroy = await userRepo.findId(sessionUser.id);

    // If the account details don't match or can't be found, stop right here
    if (!userToDestroy) {
      return res.status(404).json({ message: "User not found" });
    }

    // Permanently wipes the user's profile row out of the database
    await userRepo.delete(userToDestroy);

    // Wipes out their active login cookie card so they are logged out
    req.session!['user'] = null;

    return res.json({ message: "Account deleted successfully" });

  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});