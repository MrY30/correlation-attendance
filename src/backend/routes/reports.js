// src/backend/routes/reports.js  (or add below existing routes in this file)
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js'; // use your server-side client

const router = Router();

// GET /api/reports/:sessionId/attendance
router.get('/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    // 1) fetch session info
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('sessions')
      .select('session_name, session_id, open_date, close_date')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessionErr) throw sessionErr;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // 2) fetch attendance logs for that session
    const { data: logs, error: logsErr } = await supabaseAdmin
      .from('attendance_logs')
      .select('student_id, student_name, section, status')
      .eq('session_id', sessionId)
      .order('student_name', { ascending: true });

    if (logsErr) throw logsErr;

    return res.json({ session, logs });
  } catch (err) {
    console.error('Failed to fetch attendance for session:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
// Make sure this router is mounted in src/backend/index.js:
// app.use('/api/reports', sessionsRouter);