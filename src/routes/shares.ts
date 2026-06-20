import { Router } from 'express';
import { shareService } from '../services/shareService';
import { validate } from '../middleware/validate';
import { createShareSchema } from '../schemas/shareSchemas';

const router = Router();

// POST /shares
router.post('/', validate(createShareSchema), async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const { document_id, user_id, role } = req.body;
    
    const newShare = await shareService.shareWithUser(document_id, user_id, ownerId, role);
    return res.status(201).json(newShare);
  } catch (err) {
    next(err);
  }
});

// GET /shares/:documentId
router.get('/:documentId', async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const documentId = req.params.documentId;
    
    const shares = await shareService.listShares(documentId, ownerId);
    return res.status(200).json(shares);
  } catch (err) {
    next(err);
  }
});

export default router;
