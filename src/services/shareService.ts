import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errors';
import { Share } from '../types';

export const shareService = {
  async shareWithUser(documentId: string, targetUserId: string, ownerId: string, role: 'viewer' | 'editor'): Promise<Share> {
    if (targetUserId === ownerId) {
      throw new AppError('BAD_REQUEST', 'Cannot share a document with yourself');
    }

    // Check if document exists and is owned by ownerId
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error verifying owner: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    if (document.owner_id !== ownerId) {
      throw new AppError('FORBIDDEN', 'Only the document owner can share it');
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError || !targetUser) {
      throw new AppError('NOT_FOUND', 'Target user not found');
    }

    // Check for duplicate share
    const { data: existingShare, error: shareCheckError } = await supabase
      .from('shares')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (shareCheckError) {
      throw new AppError('BAD_REQUEST', `Error checking share record: ${shareCheckError.message}`);
    }

    if (existingShare) {
      throw new AppError('CONFLICT', 'This document is already shared with this user');
    }

    // Insert new share
    const { data: newShare, error: insertError } = await supabase
      .from('shares')
      .insert([
        {
          document_id: documentId,
          user_id: targetUserId,
          role: role
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw new AppError('BAD_REQUEST', `Failed to share document: ${insertError.message}`);
    }

    return newShare as Share;
  },

  async listShares(documentId: string, ownerId: string): Promise<any[]> {
    // Check if document exists and is owned by ownerId
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error verifying owner: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    if (document.owner_id !== ownerId) {
      throw new AppError('FORBIDDEN', 'Only the document owner can view share settings');
    }

    // Get all shares joined with user info
    const { data, error } = await supabase
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
      throw new AppError('BAD_REQUEST', `Failed to list shares: ${error.message}`);
    }

    return (data || [])
      .filter(item => item.user !== null)
      .map(item => {
        const u: any = item.user;
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
