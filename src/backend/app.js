import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routers
import studentsRouter from './routes/students.js';
import sessionsRouter from './routes/sessions.js';
import attendanceRoutes from './routes/attendance.js';
import reportsRoutes from './routes/reports.js';
import signatureRoutes from './routes/signature.js';

import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'clientPage.html'));
    // res.send("hello world")
});

app.get('/MCMAdmin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'adminPage.html'));
});

// BACKEND TESTING

// API routes
app.use('/api/students', studentsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/signature', signatureRoutes);

// Start server
app.listen(3000,() => { 
    console.log(`Server is running on http://localhost:3000`);
});
export default app;