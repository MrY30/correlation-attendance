import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import studentsRouter from './routes/students.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages', 'clientPage.html'));
});

app.get('/MCMAdmin', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages', 'adminPage.html'));
});

// API routes
app.use('/api/students', studentsRouter);

app.listen(PORT, () => { 
    console.log(`Server is running on http://localhost:${PORT}`);
 })