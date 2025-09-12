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
                .select('name, school_id, section, signature');
        
        if (studentError) throw studentError;

        const attendanceRecordsToInsert = studentProfiles.map(student => ({
            student_name: student.name,         // Map 'name' to 'student_name'
            student_id: student.school_id,      // Map 'school_id' to 'student_id'
            section: student.section,           // 'section' column names match
            session_id: newSessionId,           // Use the ID from the newly created session
            signature: student.signature,   // Include signature if needed
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

// Update an existing session
router.put('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const {
      session_name,
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

    // Validate
    if (
      !session_name ||
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

    const { data, error } = await supabaseAdmin
      .from(sessions)
      .update({
        session_name,
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
      })
      .eq('session_id', sessionId) // condition
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Session not found' });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Failed to update session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session and its attendance logs
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    if (!sessionId) return res.status(400).json({ error: 'Missing session id' });

    // FIRST: delete related attendance logs (avoid FK constraint issues)
    const { error: delAttendanceError } = await supabaseAdmin
      .from(attendance_logs)
      .delete()
      .eq('session_id', sessionId);

    if (delAttendanceError) throw delAttendanceError;

    // THEN: delete the session itself
    const { data, error: delSessionError } = await supabaseAdmin
      .from(sessions)
      .delete()
      .eq('session_id', sessionId)
      .select()
      .single();

    if (delSessionError) throw delSessionError;
    if (!data) return res.status(404).json({ error: 'Session not found' });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Failed to delete session:', err);
    res.status(500).json({ error: err.message || 'Failed to delete session' });
  }
});

export default router;