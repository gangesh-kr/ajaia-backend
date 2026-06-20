import dotenv from 'dotenv';
import { createApp } from './src/app';
import { seed } from './src/seed';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = createApp();

  // Run database seeding
  try {
    await seed();
  } catch (err) {
    console.error('Database seeding failed:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
