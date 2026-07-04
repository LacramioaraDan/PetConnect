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

  @Fields.string()
  imageUrl = "";

  @Fields.date()
  createdAt = new Date();
}