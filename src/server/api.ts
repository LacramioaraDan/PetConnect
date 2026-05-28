import { remultApi } from "remult/remult-express";
import { Animal } from "../shared/Animal";
import { createPostgresConnection } from "remult/postgres";
import { User } from "../shared/User";
import { Message } from "../shared/Message";
import { SseSubscriptionServer } from "remult/server";
import { AIBot } from "../shared/AIBot"; 

export const api = remultApi({
  entities: [User, Message, Animal],
  controllers: [AIBot], // 2. Updated registration
  getUser: (req) => req.session!['user'],
  subscriptionServer: new SseSubscriptionServer(), // SSE este suficient dacă optimizăm datele
  dataProvider: createPostgresConnection({
    connectionString: process.env["DATABASE_URL"] || 
    "postgres://postgres:MASTERKEY@localhost:5432/postgres"
  })
});