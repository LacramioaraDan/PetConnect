import { Entity, Fields, Allow } from "remult";

@Entity("messages", {
  allowApiCrud: Allow.authenticated 
})

// Message Entity Fields
export class Message {
  @Fields.string()
  id = "";

  @Fields.string()
  senderId = "";

  @Fields.string()
  recipientId = "";

  @Fields.string()
  text = "";

  // Folosim varianta cea mai simplă. 
  // Remult + Postgres maprează @Fields.string() la tipul TEXT în baza de date 
  // DACĂ tabela este creată de la zero.
  @Fields.string()
  imageUrl = "";

  @Fields.date()
  createdAt = new Date();
}