import { Allow, Entity, Fields, Relations, Validators, remult } from 'remult';
import { User } from './User';

@Entity('sittingPosts', {
    allowApiRead: Allow.authenticated,
    // Permitem inserarea doar utilizatorilor autentificați (sau poți adăuga logică de verificare dacă e petsitter)
    allowApiInsert: Allow.authenticated,
    allowApiUpdate: (entity, remult) => {
        const post = entity as SittingPost;
        if (!remult?.authenticated()) return false;
        if (remult?.user?.role === 'admin') return true;
        return post.userId === remult?.user?.id;
    },
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

    @Fields.string({
        validate: Validators.required
    })
    name = ''; // Titlul ofertei

    @Fields.string({
        validate: Validators.required
    })
    species = ''; // Speciile acceptate

    @Fields.string({
        validate: Validators.required
    })
    experience = ''; // Experiența sitter-ului

    @Fields.string({
        validate: Validators.required
    })
    pricing = ''; // Prețul sau rata (în loc de gender)

    @Fields.string({
        validate: Validators.required
    })
    location = '';

    @Fields.string({
        validate: Validators.required
    })
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