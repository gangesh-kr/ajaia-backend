import { createApp } from '../src/app';
import { seed } from '../src/seed';

const app = createApp();

// Run database seeding on startup (idempotent check)
seed().catch(err => {
  console.error('Database seeding failed:', err);
});

export default app;
