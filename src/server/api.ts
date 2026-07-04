import { remultApi } from "remult/remult-express";
import { Animal } from "../shared/Animal";
import { createPostgresConnection } from "remult/postgres";
import { User } from "../shared/User";
import { Message } from "../shared/Message";
import { SseSubscriptionServer } from "remult/server";
import { AIBot } from "../shared/AIBot"; 
import { SittingPost } from "../shared/SittingPosts";
import { LostAndFoundPost } from "../shared/LostAndFoundPosts";

// Sets up the main backend API configurations and connects it to the database
export const api = remultApi({

  // Lists all the main data groups used in the app
  entities: [User, Message, Animal, SittingPost, LostAndFoundPost],
  
  // Connects the custom code files that handle logic, like the AI chat bot
  controllers: [AIBot], 

  // Automatically grabs and tracks who is logged into the current browsing session
  getUser: (req) => req.session!['user'],

  // Sets up live updates so changes show up on screen instantly without reloading
  subscriptionServer: new SseSubscriptionServer(),

  //Links the app to the live online database or falls back to a local computer database
  dataProvider: createPostgresConnection({
    connectionString: process.env["DATABASE_URL"] || 
    "postgres://postgres:MASTERKEY@localhost:5432/postgres"
  })
});