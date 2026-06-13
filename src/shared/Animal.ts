import { Allow, Entity, Fields, Relations, Validators, remult, isBackend } from 'remult'; // <--- Make sure isBackend is imported here
import { User } from './User';

@Entity('animals', {
    allowApiRead: Allow.authenticated,
    allowApiInsert: Allow.authenticated,

    allowApiUpdate: (entity, remult) => {
        const animal = entity as Animal;
        if (!remult?.authenticated()) return false;
        if (remult?.user?.role === 'admin') return true;
        return animal.userId === remult?.user?.id;
    },

    allowApiDelete: (entity, remult) => {
        const animal = entity as Animal;
        if (!remult?.authenticated()) return false;
        if (remult?.user?.role === 'admin') return true;
        return animal?.userId === remult?.user?.id;
    },

    // FIXED: Using Remult's top-level isBackend() function and standard lifecycle arguments
    saving: async (animal, e) => {
        // Only enforce this validation logic strictly on the backend when creating a new record
        if (isBackend() && e.isNew) {
            const sessionUser = remult.user;
            if (!sessionUser) throw new Error("Forbidden: Not authenticated");
            
            // Admins bypass verification checks
            if (sessionUser.role === 'admin') return;

            if (sessionUser.role === 'shelter') {
                // Query the database dynamically to pull the real-time user record
                const dbUser = await remult.repo(User).findId(sessionUser.id);
                if (!dbUser || !dbUser.isVerified) {
                    throw new Error("Forbidden: Your shelter account is pending verification and cannot post yet.");
                }
            }
        }
    }
})
export class Animal {
    @Fields.autoIncrement()
    id = 0;

    @Fields.string({
        validate: Validators.required
    })
    name = '';

    @Fields.string({
        validate: Validators.required
    })
    species = '';

    @Fields.string({
        validate: Validators.required
    })
    gender = '';

    @Fields.string({
        validate: Validators.required
    })
    age = '';

    @Fields.string({
        validate: Validators.required
    })
    location = '';

    @Fields.string({
        validate: Validators.required
    })
    description = '';

    @Fields.string({
        inputType: 'text' 
    })
    imageUrl = '';  

    @Fields.string()
    userId = "";

    @Relations.toOne(() => User, "userId")
    user?: User;

    @Fields.date({ allowApiUpdate: false })
    createdAt = new Date();

    @Fields.string()
    postType = 'adoption'; 
}