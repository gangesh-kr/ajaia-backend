import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { documentService } from '../services/documentService';

const router = Router();

// Configure multer in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Only .txt and .md files are supported'
        }
      });
    }

    const title = path.basename(file.originalname, ext) || 'Untitled Document';
    const textContent = file.buffer.toString('utf-8');
    
    function parseInlineText(text: string): any[] {
      if (!text) return [];
      
      const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|[^*]+)/g;
      const tokens = text.match(tokenRegex) || [text];
      const nodes: any[] = [];
      
      for (const token of tokens) {
        if (token.startsWith('**') && token.endsWith('**')) {
          const innerText = token.slice(2, -2);
          if (innerText) {
            nodes.push({
              type: 'text',
              text: innerText,
              marks: [{ type: 'bold' }]
            });
          }
        } else if (token.startsWith('*') && token.endsWith('*')) {
          const innerText = token.slice(1, -1);
          if (innerText) {
            nodes.push({
              type: 'text',
              text: innerText,
              marks: [{ type: 'italic' }]
            });
          }
        } else {
          nodes.push({
            type: 'text',
            text: token
          });
        }
      }
      return nodes;
    }

    const lines = textContent.split(/\r?\n/);
    const docContent: any[] = [];
    
    interface ListStackItem {
      indent: number;
      node: any;
      lastItemNode: any;
    }
    
    let listStack: ListStackItem[] = [];

    for (const line of lines) {
      try {
        const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          listStack = [];
          const text = trimmed.substring(2).trim();
          docContent.push({
            type: 'heading',
            attrs: { level: 1 },
            content: parseInlineText(text)
          });
        } else if (trimmed.startsWith('## ')) {
          listStack = [];
          const text = trimmed.substring(3).trim();
          docContent.push({
            type: 'heading',
            attrs: { level: 2 },
            content: parseInlineText(text)
          });
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2).trim();
          const paraNode = {
            type: 'paragraph',
            content: parseInlineText(text)
          };
          const itemNode = {
            type: 'listItem',
            content: [paraNode]
          };

          if (listStack.length === 0) {
            const listNode = {
              type: 'bulletList',
              content: [itemNode]
            };
            docContent.push(listNode);
            listStack.push({
              indent: leadingSpaces,
              node: listNode,
              lastItemNode: itemNode
            });
          } else {
            let top = listStack[listStack.length - 1];
            if (leadingSpaces > top.indent) {
              const listNode = {
                type: 'bulletList',
                content: [itemNode]
              };
              top.lastItemNode.content.push(listNode);
              listStack.push({
                indent: leadingSpaces,
                node: listNode,
                lastItemNode: itemNode
              });
            } else {
              while (listStack.length > 0 && listStack[listStack.length - 1].indent > leadingSpaces) {
                listStack.pop();
              }
              if (listStack.length === 0) {
                const listNode = {
                  type: 'bulletList',
                  content: [itemNode]
                };
                docContent.push(listNode);
                listStack.push({
                  indent: leadingSpaces,
                  node: listNode,
                  lastItemNode: itemNode
                });
              } else {
                top = listStack[listStack.length - 1];
                top.node.content.push(itemNode);
                top.lastItemNode = itemNode;
              }
            }
          }
        } else {
          listStack = [];
          if (trimmed === '') {
            docContent.push({
              type: 'paragraph'
            });
          } else {
            docContent.push({
              type: 'paragraph',
              content: parseInlineText(line)
            });
          }
        }
      } catch (err) {
        listStack = [];
        docContent.push({
          type: 'paragraph',
          content: [{ type: 'text', text: line }]
        });
      }
    }

    const contentObj = {
      type: 'doc',
      content: docContent
    };

    const ownerId = req.user!.id;
    const document = await documentService.create(ownerId, title, JSON.stringify(contentObj));

    return res.status(201).json(document);
  } catch (err: any) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
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

export default router;
