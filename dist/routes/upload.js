"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const documentService_1 = require("../services/documentService");
const router = (0, express_1.Router)();
// Configure multer in-memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST',
                    message: 'No file uploaded'
                }
            });
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (ext !== '.txt' && ext !== '.md') {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Only .txt and .md files are supported'
                }
            });
        }
        const title = path_1.default.basename(file.originalname, ext) || 'Untitled Document';
        const textContent = file.buffer.toString('utf-8');
        // Convert lines to TipTap paragraph nodes
        const lines = textContent.split(/\r?\n/);
        const paragraphs = lines.map(line => {
            if (line.trim() === '') {
                return {
                    type: 'paragraph'
                };
            }
            return {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: line
                    }
                ]
            };
        });
        const contentObj = {
            type: 'doc',
            content: paragraphs
        };
        const ownerId = req.user.id;
        const document = await documentService_1.documentService.create(ownerId, title, JSON.stringify(contentObj));
        return res.status(201).json(document);
    }
    catch (err) {
        if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST',
                    message: 'File size exceeds 2MB limit'
                }
            });
        }
        next(err);
    }
});
exports.default = router;
