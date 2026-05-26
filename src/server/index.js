import express from 'express';
import { api } from './api.ts'; // <-- Added extension explicitly
import session from 'cookie-session';
import { authenticate } from './authentication.ts'; // <-- Added extension explicitly
import path from 'path';

const app = express();

// 1. Basic Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Session Middleware
app.use(
    session({
        secret: process.env['SESSION_SECRET'] || 'secret',
    })
);

// 3. Custom Authentication Routes
app.use(authenticate);

// 4. Main Remult API
app.use(api);

// 5. Test Route
app.get('/api/hi', (req, res) => res.send('Hello -)'));

// 6. Serve Angular Static Files
const distPath = path.join(process.cwd(), 'dist', 'AdoptionApp', 'browser');
app.use(express.static(distPath));

// 7. Alternative Catch-all middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});