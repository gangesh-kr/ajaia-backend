import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: error.message
        }
      });
    }

    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
