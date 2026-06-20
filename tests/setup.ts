import { seed } from '../src/seed';

beforeAll(async () => {
  // Ensure that seeded users exist before running integration tests.
  // This calls the seed script directly, populating users if missing.
  console.log('Jest setup: ensuring database is seeded...');
  await seed();
});
