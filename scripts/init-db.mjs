import { getDb } from '../src/lib/db.ts';
import { seedDatabaseIfEmpty } from '../src/lib/seed-data.ts';

try {
  console.log('Initializing PanchayatMausam database...');
  const db = getDb();
  seedDatabaseIfEmpty();
  const panchs = db.prepare('SELECT count(*) as c FROM panchayats').get();
  console.log('Database initialized successfully! Panchayat count:', panchs.c);
} catch (err) {
  console.error('Initialization error:', err);
  process.exit(1);
}
