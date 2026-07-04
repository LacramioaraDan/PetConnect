import express from 'express';
import { api } from './api';
import session from 'cookie-session';
import { authenticate } from './authentication';
import path from 'path'; //
import multer from 'multer';

// Creates the main backend server application
const app = express();

// Configures a file uploader tool and creates a folder named 'uploads' to save images
const upload = multer({ dest: 'uploads/' });

// Allows the server to accept massive text or data packages up to 50 megabytes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sets up a tracking system to remember users with a secure browser cookie
app.use(
    session({
        secret: process.env['SESSION_SECRET'] || 'secret',
    })
);

// Activates the login, logout, and signup web links
app.use(authenticate);

// Connects the database helper tool so screens can read and write data
app.use(api);

// Tests if the server is awake and responding
app.get('/api/hi', (req, res) => res.send('Hello -)'));

// Locates the final built folder where the front-end website files live
const distPath = path.join(process.cwd(), 'dist', 'AdoptionApp', 'browser');

// Opens up that front-end folder so users can open the webpage styling and logic
app.use(express.static(distPath));

app.use((req, res, next) => {

    // Opens up that front-end folder so users can open the webpage styling and logic
    if (req.url.startsWith('/api')) {
        return next();
    }
    // If a user types anything else, redirect them safely to the home page file
    res.sendFile(path.join(distPath, 'index.html'));
});

// Handles receiving an uploaded file and sends back its new saved web address
app.post('/api/upload', upload.single('file'), (req: express.Request, res: express.Response) => {

    // If the user didn't select an image or file, stop and show an error
    if (!req.file) return res.status(400).send('No file uploaded.');

    // Sends back the exact folder path location of where the file was saved
    return res.json({ url: `/uploads/${req.file!.filename}` });
});

// Tells the server to let users view files directly out of the uploads folder
app.use('/uploads', express.static('uploads'));

// Boots up the web server on port 3002 so people can start connecting to it
app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});