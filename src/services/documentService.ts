import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errors';
import { Document } from '../types';

export const documentService = {
  async create(ownerId: string, title?: string, contentJson?: string | null): Promise<Document> {
    const docTitle = title?.trim() || 'Untitled Document';
    const { data, error } = await supabase
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
      throw new AppError('BAD_REQUEST', `Failed to create document: ${error.message}`);
    }

    return data as Document;
  },

  async listOwned(ownerId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError('BAD_REQUEST', `Failed to list documents: ${error.message}`);
    }

    return data as Document[];
  },

  async listShared(userId: string): Promise<any[]> {
    // Select shared documents by joining shares -> documents -> users (owner)
    const { data, error } = await supabase
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
      throw new AppError('BAD_REQUEST', `Failed to list shared documents: ${error.message}`);
    }

    // Map to a cleaner format expected by frontend
    return (data || [])
      .filter(item => {
        const doc: any = item.document;
        return doc !== null && doc.owner_id !== userId;
      })
      .map(item => {
        const doc: any = item.document;
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

  async getById(id: string, userId: string): Promise<Document & { role: 'owner' | 'viewer' | 'editor' }> {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error loading document: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    // If owner, return with role 'owner'
    if (document.owner_id === userId) {
      return { ...(document as Document), role: 'owner' };
    }

    // Check if shared
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('role')
      .eq('document_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (shareError) {
      throw new AppError('BAD_REQUEST', `Error verifying access: ${shareError.message}`);
    }

    if (!share) {
      throw new AppError('FORBIDDEN', 'Access denied to this document');
    }

    return { ...(document as Document), role: share.role as 'viewer' | 'editor' };
  },

  async update(
    id: string,
    userId: string,
    updates: { title?: string; content_json?: string | null }
  ): Promise<Document> {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error validating owner: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    if (document.owner_id !== userId) {
      // Check if shared as editor
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('role')
        .eq('document_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (shareError) {
        throw new AppError('BAD_REQUEST', `Error verifying access: ${shareError.message}`);
      }

      if (!share) {
        throw new AppError('FORBIDDEN', 'Access denied to this document');
      }

      if (share.role !== 'editor') {
        throw new AppError('FORBIDDEN', 'Only the document owner or editors can update it');
      }
    }

    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new AppError('BAD_REQUEST', `Failed to update document: ${updateError.message}`);
    }

    return updatedDoc as Document;
  },

  async exportToMarkdown(id: string, userId: string): Promise<string> {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error loading document: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    if (document.owner_id !== userId) {
      throw new AppError('FORBIDDEN', 'Only the document owner can export it');
    }

    let content: any = null;
    if (document.content_json) {
      try {
        content = JSON.parse(document.content_json);
      } catch (err) {
        content = { type: 'doc', content: [] };
      }
    } else {
      content = { type: 'doc', content: [] };
    }

    function extractText(node: any): string {
      if (!node) return '';
      if (node.type === 'text') {
        let text = node.text || '';
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') {
              text = `**${text}**`;
            } else if (mark.type === 'italic') {
              text = `*${text}*`;
            } else if (mark.type === 'underline') {
              text = `<u>${text}</u>`;
            }
          }
        }
        return text;
      }
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
      }
      return '';
    }

    const lines: string[] = [];
    if (content && Array.isArray(content.content)) {
      for (const node of content.content) {
        if (node.type === 'heading') {
          const level = node.attrs?.level || 1;
          const hash = '#'.repeat(level);
          lines.push(`${hash} ${extractText(node)}`);
        } else if (node.type === 'bulletList') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((listItem: any) => {
              lines.push(`- ${extractText(listItem).trim()}`);
            });
          }
        } else if (node.type === 'orderedList') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((listItem: any, index: number) => {
              lines.push(`${index + 1}. ${extractText(listItem).trim()}`);
            });
          }
        } else if (node.type === 'paragraph') {
          const text = extractText(node);
          lines.push(text);
        } else {
          const text = extractText(node);
          if (text) {
            lines.push(text);
          }
        }
      }
    }

    return lines.join('\n');
  },

  async deleteDocument(id: string, userId: string): Promise<void> {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', id)
      .maybeSingle();

    if (docError) {
      throw new AppError('BAD_REQUEST', `Error loading document: ${docError.message}`);
    }

    if (!document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    if (document.owner_id !== userId) {
      throw new AppError('FORBIDDEN', 'Only the document owner can delete this document');
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new AppError('BAD_REQUEST', `Failed to delete document: ${deleteError.message}`);
    }
  }
};
