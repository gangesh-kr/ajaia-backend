"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareService = void 0;
const supabase_1 = require("../lib/supabase");
const errors_1 = require("../utils/errors");
exports.shareService = {
    async shareWithUser(documentId, targetUserId, ownerId) {
        if (targetUserId === ownerId) {
            throw new errors_1.AppError('BAD_REQUEST', 'Cannot share a document with yourself');
        }
        // Check if document exists and is owned by ownerId
        const { data: document, error: docError } = await supabase_1.supabase
            .from('documents')
            .select('owner_id')
            .eq('id', documentId)
            .maybeSingle();
        if (docError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error verifying owner: ${docError.message}`);
        }
        if (!document) {
            throw new errors_1.AppError('NOT_FOUND', 'Document not found');
        }
        if (document.owner_id !== ownerId) {
            throw new errors_1.AppError('FORBIDDEN', 'Only the document owner can share it');
        }
        // Check if target user exists
        const { data: targetUser, error: userError } = await supabase_1.supabase
            .from('users')
            .select('id')
            .eq('id', targetUserId)
            .maybeSingle();
        if (userError || !targetUser) {
            throw new errors_1.AppError('BAD_REQUEST', 'Target user not found');
        }
        // Check for duplicate share
        const { data: existingShare, error: shareCheckError } = await supabase_1.supabase
            .from('shares')
            .select('id')
            .eq('document_id', documentId)
            .eq('user_id', targetUserId)
            .maybeSingle();
        if (shareCheckError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error checking share record: ${shareCheckError.message}`);
        }
        if (existingShare) {
            throw new errors_1.AppError('CONFLICT', 'This document is already shared with this user');
        }
        // Insert new share
        const { data: newShare, error: insertError } = await supabase_1.supabase
            .from('shares')
            .insert([
            {
                document_id: documentId,
                user_id: targetUserId,
                role: 'viewer'
            }
        ])
            .select()
            .single();
        if (insertError) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to share document: ${insertError.message}`);
        }
        return newShare;
    },
    async listShares(documentId, ownerId) {
        // Check if document exists and is owned by ownerId
        const { data: document, error: docError } = await supabase_1.supabase
            .from('documents')
            .select('owner_id')
            .eq('id', documentId)
            .maybeSingle();
        if (docError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error verifying owner: ${docError.message}`);
        }
        if (!document) {
            throw new errors_1.AppError('NOT_FOUND', 'Document not found');
        }
        if (document.owner_id !== ownerId) {
            throw new errors_1.AppError('FORBIDDEN', 'Only the document owner can view share settings');
        }
        // Get all shares joined with user info
        const { data, error } = await supabase_1.supabase
            .from('shares')
            .select(`
        id,
        role,
        created_at,
        user:users (
          id,
          name,
          email
        )
      `)
            .eq('document_id', documentId);
        if (error) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to list shares: ${error.message}`);
        }
        return (data || [])
            .filter(item => item.user !== null)
            .map(item => {
            const u = item.user;
            return {
                id: item.id,
                role: item.role,
                created_at: item.created_at,
                user_id: u.id,
                name: u.name,
                email: u.email
            };
        });
    }
};
