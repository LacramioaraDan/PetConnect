import { Entity, Fields, Relations, Validators } from "remult";
import { User } from "./User";

@Entity("lostAndFoundPosts", {
  allowApiCrud: true
})
export class LostAndFoundPost {
  @Fields.autoIncrement()
  id = 0;

  @Fields.string({ validate: Validators.required })
  species = '';

  @Fields.string({ validate: Validators.required })
  gender = '';

  @Fields.string({ validate: Validators.required })
  age = '';

  @Fields.string()
  breed = '';

  @Fields.string({ inputType: 'text' })
  imageUrl = '';

  // --- Physical Attributes ---
  @Fields.string()
  size = '';

  @Fields.json()
  colors: string[] = []; 

  @Fields.string()
  pattern = '';

  @Fields.string()
  weightRange = '';

  @Fields.string()
  distinguishingFeatures = '';

  @Fields.string()
  collarDetails = '';

  @Fields.boolean()
  microchipped = false;

  @Fields.string()
  status: string = 'lost'; 

  @Fields.string()
  postType: 'lost' | 'found' = 'lost';

  @Fields.string()
  lastSeenLocation = '';
  
  @Fields.string({ validate: Validators.required })
  description = '';

  @Fields.string()
  userId = "";

  @Relations.toOne(() => User, "userId")
  user?: User;

  @Fields.date({ allowApiUpdate: false })
  createdAt = new Date();
}