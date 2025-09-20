// src/backend/routes/attendance.js
import { Router } from 'express';
import { supabaseAdmin, storage } from '../lib/supabaseClient.js';

const router = Router();

const student_profile = 'deployed_student_profile';
const attendance_logs = 'attendance_logs_v2';
const bucket_name = 'student-signatures';

// POST /api/attendance/scan
router.post('/scan', async (req, res) => {
  try {
    const { rfidCode, sessionId, statusColumn } = req.body;

    if (!rfidCode || !sessionId || !statusColumn) {
      return res.status(400).json({ error: 'Missing RFID code or sessionId or statusColumn' });
    }

    // ✅ Sanitize: allow only expected column names
    const validColumns = ['exam_status', 'am_status', 'pm_status'];
    if (!validColumns.includes(statusColumn)) {
      return res.status(400).json({ error: 'Invalid status column' });
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

    // Step 2: Check for signature in storage
    const signaturePath = `${student.school_id}.png`;
    const { data: fileList, error: listError } = await storage
      .from(bucket_name)
      .list('', { search: signaturePath }); // look for <school_id>.png

    if (listError) {
      console.error('Signature check error:', listError.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const hasSignature = fileList && fileList.length > 0;

    if (!hasSignature) {
      // ⚠️ Tell frontend to open signature modal
      return res.json({
        status: 'sign-first',
        student
      });
    }

    // Step 3: Look up attendance log for this session + student
    const { data: log, error: logError } = await supabaseAdmin
      .from(attendance_logs)
      .select(`${statusColumn}`)
      .eq('session_id', sessionId)
      .eq('student_id', student.school_id)
      .single();

    if (logError || !log) {
      return res.json({ status: 'not-found' }); // maybe no log initialized
    }

    // Step 4: Already attended?
    if (log[statusColumn] === 'Present' || log[statusColumn] === 'Late') {
      return res.json({
        status: 'already-attended',
        student
      });
    }

    // Step 5: Fetch session late cutoff from sessions_v2
    const columnMap = {
      exam_status: 'weekly_late',
      am_status: 'am_late',
      pm_status: 'pm_late'
    };
    const lateColumn = columnMap[statusColumn];

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions_v2')
      .select(lateColumn)
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session lookup error:', sessionError?.message);
      return res.status(500).json({ error: 'Failed to fetch session late time' });
    }

    const lateTimeStr = session[lateColumn]; // e.g. "08:30:00"

    // Build cutoff Date object for today
    const [hours, minutes, seconds] = lateTimeStr.split(':').map(Number);
    const now = new Date();
    const lateCutoff = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      seconds || 0
    );

    // Step 6: Determine status
    const newStatus = now > lateCutoff ? 'Late' : 'Present';

    // Step 7: Update only the correct column
    const { error: updateError } = await supabaseAdmin
      .from(attendance_logs)
      .update({ [statusColumn]: newStatus })
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
