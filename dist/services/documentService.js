"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = void 0;
const supabase_1 = require("../lib/supabase");
const errors_1 = require("../utils/errors");
exports.documentService = {
    async create(ownerId, title, contentJson) {
        const docTitle = title?.trim() || 'Untitled Document';
        const { data, error } = await supabase_1.supabase
            .from('documents')
            .insert([
            {
                title: docTitle,
                content_json: contentJson || null,
                owner_id: ownerId,
            }
        ])
            .select()
            .single();
        if (error) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to create document: ${error.message}`);
        }
        return data;
    },
    async listOwned(ownerId) {
        const { data, error } = await supabase_1.supabase
            .from('documents')
            .select('*')
            .eq('owner_id', ownerId)
            .order('updated_at', { ascending: false });
        if (error) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to list documents: ${error.message}`);
        }
        return data;
    },
    async listShared(userId) {
        // Select shared documents by joining shares -> documents -> users (owner)
        const { data, error } = await supabase_1.supabase
            .from('shares')
            .select(`
        id,
        role,
        document_id,
        document:documents (
          id,
          title,
          content_json,
          owner_id,
          created_at,
          updated_at,
          owner:users!owner_id (
            name,
            email
          )
        )
      `)
            .eq('user_id', userId);
        if (error) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to list shared documents: ${error.message}`);
        }
        // Map to a cleaner format expected by frontend
        return (data || [])
            .filter(item => item.document !== null)
            .map(item => {
            const doc = item.document;
            return {
                id: doc.id,
                title: doc.title,
                content_json: doc.content_json,
                owner_id: doc.owner_id,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                owner_name: doc.owner ? doc.owner.name : 'Unknown',
                owner_email: doc.owner ? doc.owner.email : 'Unknown',
                role: item.role
            };
        });
    },
    async getById(id, userId) {
        const { data: document, error: docError } = await supabase_1.supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (docError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error loading document: ${docError.message}`);
        }
        if (!document) {
            throw new errors_1.AppError('NOT_FOUND', 'Document not found');
        }
        // If owner, return with role 'owner'
        if (document.owner_id === userId) {
            return { ...document, role: 'owner' };
        }
        // Check if shared
        const { data: share, error: shareError } = await supabase_1.supabase
            .from('shares')
            .select('role')
            .eq('document_id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (shareError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error verifying access: ${shareError.message}`);
        }
        if (!share) {
            throw new errors_1.AppError('FORBIDDEN', 'Access denied to this document');
        }
        return { ...document, role: 'viewer' };
    },
    async update(id, userId, updates) {
        const { data: document, error: docError } = await supabase_1.supabase
            .from('documents')
            .select('owner_id')
            .eq('id', id)
            .maybeSingle();
        if (docError) {
            throw new errors_1.AppError('BAD_REQUEST', `Error validating owner: ${docError.message}`);
        }
        if (!document) {
            throw new errors_1.AppError('NOT_FOUND', 'Document not found');
        }
        if (document.owner_id !== userId) {
            throw new errors_1.AppError('FORBIDDEN', 'Only the document owner can update it');
        }
        const { data: updatedDoc, error: updateError } = await supabase_1.supabase
            .from('documents')
            .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            throw new errors_1.AppError('BAD_REQUEST', `Failed to update document: ${updateError.message}`);
        }
        return updatedDoc;
    }
};
