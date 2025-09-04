// src/backend/routes/students.js
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();


const student_profile = 'student_profile';

// const student_profile = 'deployed_student_profile';

/**
 * GET /api/students
 * Optional query params: ?page=1&limit=200
 * Adjust selected columns to match your 'student_profile' schema.
 */
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 200;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Adjust column names to your table schema if different.
    const columns = 'name,school_id,section,rfid_code';

    const { data, error } = await supabaseAdmin
      .from(student_profile)
      .select(columns)
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error('Failed to fetch students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
