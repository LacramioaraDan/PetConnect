import express from 'express';
import { api } from './api';
import session from 'cookie-session';
import { authenticate } from './authentication';
import path from 'path'; // <-- Make sure to add this import line!

const app = express();

// 1. Basic Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Session Middleware (Must be before routes that use it)
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

// 7. Catch-all route (Updated syntax for newer Express versions)
app.get('/:any*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});