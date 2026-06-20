# DocFlow — Collaborative Rich Text Editor

DocFlow is a lightweight, responsive document editor demonstrating full-stack coordination. The scope focuses on single-editor workspace interaction, client-side format importing, and simple relational document sharing.

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://ajaia-frontend.vercel.app |
| Backend API | https://ajaia-backend.vercel.app/api/v1 |

## Test Credentials

No password is required. Switch active users via the top-right header switcher.

| Name | Email |
|---|---|
| Alice | alice@example.com |
| Bob | bob@example.com |
| Charlie | charlie@example.com |

## To Test Sharing

1. Log in as **Alice**, create a document, click **Share**, and grant access to **Bob**.
2. Switch active user to **Bob** in the header.
3. Observe the shared document under **Shared With Me** in read-only mode (editor toolbar hidden).

## Local Setup

### Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | Local service port (default: 4000) |
| `SUPABASE_URL` | Supabase API connection URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase access key bypassing RLS |
| `FRONTEND_URL` | Trusted CORS origin URL |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Express backend target API URL |

## Supported File Uploads
Only `.txt` and `.md` formats (maximum 2MB size limit) are accepted.

## Known Limitations
- Markdown parser imports headings and bullet lists only (other formats default to text).
- Document lists refetch completely on user change (no local-first client cache).
- No actual password authentication exists (uses simulated headers).
- Collaboration is single-user per session (no simultaneous multiplayer editing).

## Intentional Scope Cuts
- **Real-time collaboration**: Avoids complex CRDT synchronization structures to fit the development schedule.
- **Authentication**: Uses simulated header-based session switching to keep reviewer testing frictionless.
- **Granular roles**: Viewer and Owner cover the required access controls without layout overhead.
- **PDF Export**: Markdown download is built instead, eliminating heavy server-side puppeteer dependencies.
- **Comments and suggestions**: Omitted to keep database models and interface components light.

## What Would Be Next
- Revisions history utilizing an append-only document revision database table.
- Real-time online presence indicators using Supabase realtime channels.
- Expand markdown import styling to parse inline code blocks and quotes.

> **Note:** The backend is deployed on Vercel as a Serverless Function, 
> ensuring instant response times without cold-start sleep cycles.

## AI Usage Note
This application was built utilizing Claude 3.5 Sonnet to draft the database model structure and helper text conversion. The generated code was manually validated and debugged to adhere to standard TypeScript typing and secure Express routes.
