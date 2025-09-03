import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routers
import studentsRouter from './routes/students.js';
import sessionsRouter from './routes/sessions.js';

import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'clientPage.html'));
});

app.get('/MCMAdmin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'adminPage.html'));
});

// API routes
app.use('/api/students', studentsRouter);
app.use('/api/sessions', sessionsRouter);

// Start server
app.listen(PORT,() => { 
    console.log(`Server is running on http://localhost:${PORT}`);
});