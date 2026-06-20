"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShareSchema = void 0;
const zod_1 = require("zod");
exports.createShareSchema = zod_1.z.object({
    document_id: zod_1.z.string().uuid('Invalid document_id UUID format'),
    user_id: zod_1.z.string().uuid('Invalid user_id UUID format')
});
