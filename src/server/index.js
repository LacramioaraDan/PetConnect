import express from 'express';
import { api } from './api';
import session from 'cookie-session';
import { authenticate } from './authentication';

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

app.use(express.static('process.cwd() + "/dist/AdoptionApp"'));

app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});