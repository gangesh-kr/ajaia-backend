# AI Workflow Reflection — Developer Perspective

I used AI as a pairing partner to accelerate DocFlow’s development, but treated it as an assistant rather than the decision-maker. Here is how that collaboration went:

### 1. What the AI Handled
- **Boilerplate & Framing**: Setting up Express routing, basic Zod schemas, and Tailwind templates. It was fast at generating initial structures so I could focus on logic.
- **Client-side Markdown Parsing**: The AI drafted the core of the TipTap JSON-to-Markdown translator. I tweaked it to match our backend format and immediately render bold/italic styles.

### 2. Where I Had to Intervene (AI Rejections & Code Adjustments)
- **Supabase Realtime Sync**: The AI originally suggested hooking up Supabase Realtime for document editing. I rejected this. For our scale and requirements, a robust 2-second debounced HTTP save is simple, reliable, and avoids state synchronization overhead.
- **Race Condition Prevention**: The AI's initial autosave code was prone to out-of-order writes. I corrected this by introducing `AbortController` to abort any in-flight save when the user kept typing, preventing old requests from overwriting newer edits.
- **Autosave Layout Shift**: The AI originally suggested mounting/unmounting a simple text element for the save status, which caused the formatting toolbar to shift. I refactored it into a fixed-width (`w-[160px]`) state machine component that remains mounted.
- **Error Recovery**: I designed the retry loop on 500 errors. Instead of failing silently or crashing, the client now retries the save automatically up to 3 times.

### 3. Verification Method
I validated the system using three layers:
1. **TypeScript strict checks** for clean compilation.
2. **Jest + Supertest integration suite** to verify endpoint routes and validation errors.
3. **Manual testing** using side-by-side Incognito tabs (Alice and Bob) to confirm that the View-only toolbar is locked, the Read Only badge displays correctly, and document changes propagate accurately.
