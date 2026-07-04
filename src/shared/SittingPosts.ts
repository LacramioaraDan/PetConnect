import { Allow, Entity, Fields, Relations, Validators, remult } from 'remult';
import { User } from './User';

@Entity('sittingPosts', {

    // Logged-in users can read or create these posts
    allowApiRead: Allow.authenticated,
    allowApiInsert: Allow.authenticated,

    // Only admins or the post creator can edit posts
    allowApiUpdate: (entity, remult) => {
        const post = entity as SittingPost;
        if (!remult?.authenticated()) return false;
        if (remult?.user?.role === 'admin') return true;
        return post.userId === remult?.user?.id;
    },

    // Only admins or the post creator can delete posts
    allowApiDelete: (entity, remult) => {
        const post = entity as SittingPost;
        if (!remult?.authenticated()) return false;
        if (remult?.user?.role === 'admin') return true;
        return post?.userId === remult?.user?.id;
    }
})

// SittingPost Entity Fields
export class SittingPost {
    @Fields.autoIncrement()
    id = 0;

    @Fields.string({validate: Validators.required})
    name = '';

    @Fields.string({validate: Validators.required})
    species = '';

    @Fields.string({validate: Validators.required})
    experience = '';

    @Fields.string({validate: Validators.required})
    pricing = '';

    @Fields.string({validate: Validators.required})
    location = '';

    @Fields.string({validate: Validators.required})
    description = '';

    @Fields.string()
    imageUrl = '';  

    @Fields.string()
    userId = "";

    @Relations.toOne(() => User, "userId")
    user?: User;

    @Fields.date({ allowApiUpdate: false })
    createdAt = new Date();
}