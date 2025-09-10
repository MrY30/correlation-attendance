import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();

// const sessions = 'deployed_sessions';
const sessions = 'sessions_v2';
const student_profile = 'deployed_student_profile';
// const attendance_logs = 'deployed_attendance_logs';
const attendance_logs = 'attendance_logs_v2';

router.post('/', async (req, res) => {
    try{
        // Get the data from the request body
        const { 
            session_name,
            session_id,
            publish_date,
            weekly_start,
            weekly_late,
            weekly_end,
            am_start,
            am_late,
            am_end,
            pm_start,
            pm_late,
            pm_end
         } = req.body;

        // Validate that required data is present
        if (
            !session_name ||
            !session_id ||
            !publish_date ||
            !weekly_start ||
            !weekly_late ||
            !weekly_end ||
            !am_start ||
            !am_late ||
            !am_end ||
            !pm_start ||
            !pm_late ||
            !pm_end
        ) {
            return res.status(400).json({ error: 'Missing required session data.' });
        }

        // Insert data into your Supabase table (e.g., a table named 'sessions')
        const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from(sessions) // ❗ Make sure 'sessions' is your actual table name
            .insert([
                {
                    // Map your data to the column names in your Supabase table
                    session_name: session_name,
                    session_id: session_id,
                    publish_date: publish_date,
                    weekly_start: weekly_start,
                    weekly_late: weekly_late,
                    weekly_end: weekly_end,
                    am_start: am_start,
                    am_late: am_late,
                    am_end: am_end,
                    pm_start: pm_start,
                    pm_late: pm_late,
                    pm_end: pm_end
                }
            ])
            .select()
            .single(); // .select() returns the inserted data
        
        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Failed to create session or retrieve its ID.');

        const newSessionId = sessionData.session_id;

        const { data: studentProfiles, error: studentError } = await supabaseAdmin
                .from(student_profile) // Your source table
                .select('name, school_id, section');
        
        if (studentError) throw studentError;

        const attendanceRecordsToInsert = studentProfiles.map(student => ({
            student_name: student.name,         // Map 'name' to 'student_name'
            student_id: student.school_id,      // Map 'school_id' to 'student_id'
            section: student.section,           // 'section' column names match
            session_id: newSessionId,           // Use the ID from the newly created session
            exam_status: 'Absent',
            am_status: 'Absent',
            pm_status: 'Absent'
        }));

        if (attendanceRecordsToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from(attendance_logs) // Your destination table
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

// EDIT BUT LATER
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(sessions)
      .select('session_name, session_id, publish_date, weekly_start, weekly_late, weekly_end, am_start, am_late, am_end, pm_start, pm_late, pm_end') // adjust column names as needed
      .order('publish_date', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});


export default router;