// src/backend/routes/signature.js
import { Router } from 'express';
import { storage, supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();

const attendance_logs = 'attendance_logs_v2';

router.post('/save', async (req, res) => {
  try {
    const { schoolId, sessionId, statusColumn, signature } = req.body;

    if (!schoolId || !sessionId || !statusColumn || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validColumns = ['exam_status', 'am_status', 'pm_status'];
    if (!validColumns.includes(statusColumn)) {
      return res.status(400).json({ error: 'Invalid status column' });
    }

    // --- 1. Save signature to bucket ---
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `${schoolId}.png`;

    const { error: uploadError } = await storage
      .from('correlation-attendance')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Step 2: Check if already attended
    const { data: log, error: logError } = await supabaseAdmin
      .from(attendance_logs)
      .select(statusColumn)
      .eq('session_id', sessionId)
      .eq('student_id', schoolId)
      .single();

    if (!logError && log && log[statusColumn] === 'Present') {
      return res.json({ success: true, status: 'already-attended' });
    }

    // --- 2. Update attendance status ---
    const { error: updateError } = await supabaseAdmin
      .from(attendance_logs)
      .update({ [statusColumn]: 'Present' })
      .eq('session_id', sessionId)
      .eq('student_id', schoolId);

    if (updateError) throw updateError;

    res.json({ success: true, path: filePath, status: 'present' });
  } catch (err) {
    console.error('Signature save error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;