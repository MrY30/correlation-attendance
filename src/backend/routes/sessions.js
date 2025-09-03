import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();

router.post('/', async (req, res) => {
    try{
        // Get the data from the request body
        const { session_name, session_id, open_date, close_date } = req.body;

        // Validate that required data is present
        if (!session_name || !session_id || !open_date || !close_date) {
            return res.status(400).json({ error: 'Missing required session data.' });
        }

        // Insert data into your Supabase table (e.g., a table named 'sessions')
        const { data: sessionData, error: sessionError } = await supabaseAdmin
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

        const { data: studentProfiles, error: studentError } = await supabaseAdmin
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
            const { error: insertError } = await supabaseAdmin
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

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('session_name, session_id, open_date, close_date') // adjust column names as needed
      .order('open_date', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});


export default router;