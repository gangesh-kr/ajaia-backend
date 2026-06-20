"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shareService_1 = require("../services/shareService");
const validate_1 = require("../middleware/validate");
const shareSchemas_1 = require("../schemas/shareSchemas");
const router = (0, express_1.Router)();
// POST /shares
router.post('/', (0, validate_1.validate)(shareSchemas_1.createShareSchema), async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const { document_id, user_id } = req.body;
        const newShare = await shareService_1.shareService.shareWithUser(document_id, user_id, ownerId);
        return res.status(201).json(newShare);
    }
    catch (err) {
        next(err);
    }
});
// GET /shares/:documentId
router.get('/:documentId', async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const documentId = req.params.documentId;
        const shares = await shareService_1.shareService.listShares(documentId, ownerId);
        return res.status(200).json(shares);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
