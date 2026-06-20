"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentService_1 = require("../services/documentService");
const validate_1 = require("../middleware/validate");
const documentSchemas_1 = require("../schemas/documentSchemas");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
// POST /documents
router.post('/', async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const document = await documentService_1.documentService.create(ownerId);
        return res.status(201).json(document);
    }
    catch (err) {
        next(err);
    }
});
// GET /documents
router.get('/', async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const documents = await documentService_1.documentService.listOwned(ownerId);
        return res.status(200).json(documents);
    }
    catch (err) {
        next(err);
    }
});
// GET /documents/shared
router.get('/shared', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const documents = await documentService_1.documentService.listShared(userId);
        return res.status(200).json(documents);
    }
    catch (err) {
        next(err);
    }
});
// GET /documents/:id
router.get('/:id', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const docId = req.params.id;
        const document = await documentService_1.documentService.getById(docId, userId);
        return res.status(200).json(document);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /documents/:id
router.patch('/:id', (0, validate_1.validate)(documentSchemas_1.updateDocumentSchema), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const docId = req.params.id;
        const { title, content_json } = req.body;
        // Explicit check for title empty
        if (title !== undefined && title.trim() === '') {
            throw new errors_1.AppError('BAD_REQUEST', 'Title cannot be empty');
        }
        const updatedDoc = await documentService_1.documentService.update(docId, userId, { title, content_json });
        return res.status(200).json(updatedDoc);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
