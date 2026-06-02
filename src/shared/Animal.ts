import { Allow, Entity, Fields, Relations, Validators, remult } from 'remult';
import { User } from './User';

@Entity('animals', {
    allowApiRead: Allow.authenticated,
    allowApiInsert: Allow.authenticated,

    allowApiUpdate: (animal) => {
        if (!remult.authenticated()) return false;
        if (remult.user?.role === 'admin') return true;
        return animal?.userId === remult.user?.id;
    },

    allowApiDelete: (animal) => {
        if (!remult.authenticated()) return false;
        if (remult.user?.role === 'admin') return true;
        return animal?.userId === remult.user?.id;
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

    // FIXED: Added postType discriminator to differentiate adoption posts from sitting offers
    @Fields.string()
    postType = 'adoption'; 
}