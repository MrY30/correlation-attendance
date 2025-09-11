// src/backend/routes/attendance.js
import { Router } from 'express';
import { supabaseAdmin, storage } from '../lib/supabaseClient.js';

const router = Router();

const student_profile = 'deployed_student_profile';
const attendance_logs = 'attendance_logs_v2';

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
      .from('correlation-attendance')
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
    if (log[statusColumn] === 'Present') {
      return res.json({
        status: 'already-attended',
        student
      });
    }

    // Step 5: Update status to Present
    const { error: updateError } = await supabaseAdmin
      .from(attendance_logs)
      .update({ [statusColumn]: 'Present' })
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
