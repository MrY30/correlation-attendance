// src/backend/routes/students.js
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();

const student_profile = 'deployed_student_profile';

// This functions is intended in getting the list of Sections available
async function getSections() {
  try {
    // Replace "students" with your actual table name
    const { data, error } = await supabaseAdmin
      .from(student_profile)
      .select('section', { distinct: true });

    if (error) {
      throw error;
    }

    // Extract unique sections
    const sections = [...new Set(data.map(item => item.section))];

    console.log('List of Sections:', sections);
    return sections;
  } catch (err) {
    console.error('Error fetching sections:', err.message);
  }
}

/**
 * GET /api/students
 * Optional query params: ?page=1&limit=200
 * Adjust selected columns to match your 'student_profile' schema.
 */
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 1000;
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
    // getSections(); Trigger this if you want to know the section list

  } catch (err) {
    console.error('Failed to fetch students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
