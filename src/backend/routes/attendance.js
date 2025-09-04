// src/backend/routes/attendance.js
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();

// const student_profile = 'student_profile';
// const attendance_logs = 'attendance_logs';

const student_profile = 'deployed_student_profile';
const attendance_logs = 'deployed_attendance_logs';

// POST /api/attendance/scan
router.post('/scan', async (req, res) => {
  try {
    const { rfidCode, sessionId } = req.body;

    if (!rfidCode || !sessionId) {
      return res.status(400).json({ error: 'Missing RFID code or sessionId' });
    }

    // Step 1: Find student by RFID code
    const { data: student, error: studentError } = await supabaseAdmin
      .from(student_profile)
      .select('school_id, name, section')
      .eq('rfid_code', rfidCode)
      .single();

    if (studentError || !student) {
      return res.json({ status: 'not-found' });
    }

    // Step 2: Look up attendance log for this session + student
    const { data: log, error: logError } = await supabaseAdmin
      .from(attendance_logs)
      .select('status')
      .eq('session_id', sessionId)
      .eq('student_id', student.school_id)
      .single();

    if (logError || !log) {
      return res.json({ status: 'not-found' }); // maybe no log initialized
    }

    // Step 3: Already attended?
    if (log.status === 'Present') {
      return res.json({
        status: 'already-attended',
        student
      });
    }

    // Step 4: Update status to Present
    const { error: updateError } = await supabaseAdmin
      .from(attendance_logs)
      .update({ status: 'Present' })
      .eq('session_id', sessionId)
      .eq('student_id', student.school_id);

    if (updateError) throw updateError;

    res.json({
      status: 'present',
      student
    });
  } catch (err) {
    console.error('Attendance scan error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
