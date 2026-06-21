# Submission Deliverables Checklist

This checklist confirms the completion and availability of all requested components for the DocFlow Full Stack Assessment.

---

## 1. File & Codebase Structure
- [x] **`frontend/`** — Next.js 14 App Router client with TypeScript, TipTap Editor, TailwindCSS, and TanStack Query.
- [x] **`backend/`** — Express.js API gateway with Zod schemas, RESOLVE_USER and error handling middleware, and Supabase JS clients.
- [x] **`README.md`** — Comprehensive local installation setup, Supabase database configuration, and running Jest tests.
- [x] **`ARCHITECTURE.md`** — Documenting technology stack decisions, Access Control validations, and tradeoffs.
- [x] **`AI_WORKFLOW.md`** — Outlining tool usage, prompt decisions, acceptances, and verification results.
- [x] **`SUBMISSION.md`** — This flat checklist of deliverables.

---

## 2. Supabase Database Schema Setup
- [x] **`users` table** — Created in Supabase under public schema.
- [x] **`documents` table** — Created in Supabase, linked to owner, stores content as TipTap JSON.
- [x] **`shares` table** — Created in Supabase, implements cascading delete and unique constraint on `(document_id, user_id)`.
- [x] **Database Seed** — Idempotent user seeding for Alice, Bob, and Charlie executed on backend server initialization.

---

## 3. Core Features Implemented & Tested
- [x] **Simulated Sessions** — Switching active user via Header select dropdown invalidates list caches.
- [x] **Document CRUD** — Creating empty document, viewing, and modifying title/content.
- [x] **Collaborative Access Sharing** — Allowing owners to share documents with viewers. Excludes self-shares and duplicate shares.
- [x] **Autosave** — Debounced autosave (2000ms) with visual status indicators.
- [x] **Read-only Mode** — Restricts shared viewers from updating title/content and hides formatting toolbar.
- [x] **Text/Markdown Import** — Parses uploaded `.txt` and `.md` files (up to 2MB) into paragraph nodes.
- [x] **Export to Markdown (Stretch Goal)** — Translates internal TipTap JSON structure back into markdown text and triggers download on both owner and viewer sessions.
- [x] **Automated Test Suite** — Integration tests passed via `npm test`.

---

## 4. Deployment & Live Credentials
- **Live Frontend**: https://ajaia-frontend.vercel.app
- **Live Backend**: https://ajaia-backend.vercel.app/api/v1
- **Health Check**: https://ajaia-backend.vercel.app/health
- **Local Dev Server Frontend**: `http://localhost:3000`
- **Local Dev Server Backend**: `http://localhost:4000/api/v1`
- **Seeded User Credentials**:
  - `alice@example.com` (Alice)
  - `bob@example.com` (Bob)
  - `charlie@example.com` (Charlie)
- **Walkthrough Video**: https://www.loom.com/share/docflow-submission-walkthrough
