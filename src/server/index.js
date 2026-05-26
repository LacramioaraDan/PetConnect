// 1. Register ts-node on-the-fly using your server configuration rules
// This lets standard Node run your TypeScript files seamlessly in production!
require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.server.json')
});

const express = require('express');
const path = require('path');
const session = require('cookie-session');

// 2. Import your local TypeScript modules safely using CommonJS require syntax
const { api } = require('./api.ts');
const { authenticate } = require('./authentication.ts');

const app = express();

// 3. Basic Payload Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Session Middleware
app.use(
    session({
        secret: process.env['SESSION_SECRET'] || 'secret',
    })
);

// 5. Custom Authentication Routes
app.use(authenticate);

// 6. Main Remult API Backend Routes
app.use(api);

// 7. Health Test Route
app.get('/api/hi', (req, res) => res.send('Hello -)'));

// 8. Serve Optimized Angular Static Frontend Files
const distPath = path.join(process.cwd(), 'dist', 'AdoptionApp', 'browser');
app.use(express.static(distPath));

// 9. Global Routing Catch-all Middleware fallback rule
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// 10. Start the Live Cloud Listening Thread
app.listen(process.env['PORT'] || 3002, () => {
    console.log('Started =)');
});