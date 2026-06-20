"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDocumentSchema = void 0;
const zod_1 = require("zod");
exports.updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title cannot be empty').optional(),
    content_json: zod_1.z.string().nullable().optional()
});
