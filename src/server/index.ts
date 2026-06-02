import express from 'express';
import { api } from './api';
import session from 'cookie-session';
import { authenticate } from './authentication';
import path from 'path'; //
 import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
    session({
        secret: process.env['SESSION_SECRET'] || 'secret',
    })
);

// 3. Custom Authentication Routes (Must be before the main Remult API)
app.use(authenticate);

// 4. Main Remult API
app.use(api);

// 5. Test Route
app.get('/api/hi', (req, res) => res.send('Hello -)'));

// 6. Serve Angular Static Files (Fixed path and removed string quotes)
const distPath = path.join(process.cwd(), 'dist', 'AdoptionApp', 'browser');
app.use(express.static(distPath));

// 7. Alternative Catch-all middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    // Return the path/URL to the file
    res.json({ url: `/uploads/${req.file.filename}` });
});

// IMPORTANT: Tell express to serve the files so they can be opened
app.use('/uploads', express.static('uploads'));

app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});