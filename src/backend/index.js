import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import studentsRouter from './routes/students.js';
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

app.post('/api/add-session', async (req, res) => {
    try{
        // Get the data from the request body
        const { session_name, session_id, open_date, close_date } = req.body;

        // Validate that required data is present
        if (!session_name || !session_id || !open_date || !close_date) {
            return res.status(400).json({ error: 'Missing required session data.' });
        }

        // Insert data into your Supabase table (e.g., a table named 'sessions')
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions') // ❗ Make sure 'sessions' is your actual table name
            .insert([
                {
                    // Map your data to the column names in your Supabase table
                    session_name: session_name, // e.g., 'session_name' is the column in Supabase
                    session_id: session_id,
                    open_date: open_date,
                    close_date: close_date,
                }
            ])
            .select()
            .single(); // .select() returns the inserted data
        
        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Failed to create session or retrieve its ID.');

        const newSessionId = sessionData.session_id;

        const { data: studentProfiles, error: studentError } = await supabase
                .from('student_profile') // Your source table
                .select('name, school_id, section');
        
        if (studentError) throw studentError;

        const attendanceRecordsToInsert = studentProfiles.map(student => ({
            student_name: student.name,         // Map 'name' to 'student_name'
            student_id: student.school_id,      // Map 'school_id' to 'student_id'
            section: student.section,           // 'section' column names match
            session_id: newSessionId,           // Use the ID from the newly created session
            status: 'Absent'                    // Set the default status
        }));

        if (attendanceRecordsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('attendance_logs') // Your destination table
                .insert(attendanceRecordsToInsert);

            if (insertError) throw insertError;
        }

        // --- Success ---
        res.status(201).json({ 
            success: true, 
            message: `Session created and ${attendanceRecordsToInsert.length} attendance logs initialized.` 
        });
    } catch (error) {
        console.error('Operation failed:', error.message);
        res.status(500).json({ error: error.message });
    }
    
});

// Start server
app.listen(PORT,() => { 
    console.log(`Server is running on http://localhost:${PORT}`);
});