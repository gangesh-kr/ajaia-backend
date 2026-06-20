import { Router } from 'express';
import { documentService } from '../services/documentService';
import { validate } from '../middleware/validate';
import { updateDocumentSchema } from '../schemas/documentSchemas';
import { AppError } from '../utils/errors';

const router = Router();

// POST /documents
router.post('/', async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const document = await documentService.create(ownerId);
    return res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

// GET /documents
router.get('/', async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const documents = await documentService.listOwned(ownerId);
    return res.status(200).json(documents);
  } catch (err) {
    next(err);
  }
});

// GET /documents/shared
router.get('/shared', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const documents = await documentService.listShared(userId);
    return res.status(200).json(documents);
  } catch (err) {
    next(err);
  }
});

// GET /documents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    const document = await documentService.getById(docId, userId);
    return res.status(200).json(document);
  } catch (err) {
    next(err);
  }
});

// PATCH /documents/:id
router.patch('/:id', validate(updateDocumentSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    const { title, content_json } = req.body;
    
    // Explicit check for title empty
    if (title !== undefined && title.trim() === '') {
      throw new AppError('BAD_REQUEST', 'Title cannot be empty');
    }

    const updatedDoc = await documentService.update(docId, userId, { title, content_json });
    return res.status(200).json(updatedDoc);
  } catch (err) {
    next(err);
  }
});

// GET /documents/:id/export
router.get('/:id/export', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    
    const document = await documentService.getById(docId, userId);
    const markdown = await documentService.exportToMarkdown(docId, userId);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/"/g, '\\"')}.md"`);
    return res.status(200).send(markdown);
  } catch (err) {
    next(err);
  }
});

// POST /documents/:id/export
router.post('/:id/export', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    
    const document = await documentService.getById(docId, userId);
    const markdown = await documentService.exportToMarkdown(docId, userId);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/"/g, '\\"')}.md"`);
    return res.status(200).send(markdown);
  } catch (err) {
    next(err);
  }
});

// DELETE /documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const docId = req.params.id;
    
    await documentService.deleteDocument(docId, userId);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
