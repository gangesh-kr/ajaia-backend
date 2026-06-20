import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content_json: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Share {
  id: string;
  document_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
