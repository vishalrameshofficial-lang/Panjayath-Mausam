const fs = require('fs');

const fullCode = fs.readFileSync('scripts/seed-pan-india-all.ts', 'utf8');

const targetHeader = `import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'panchayat_mausam.db');
const db = new DatabaseSync(DB_PATH);`;

const replacementHeader = `import { getDb } from './db';

export function seedDatabaseIfEmpty() {
  const db = getDb();
  const districtCount = db.prepare('SELECT COUNT(*) as count FROM districts').get();
  if (districtCount && (districtCount as any).count >= 100) {
    return;
  }`;

const updatedCode = fullCode.replace(targetHeader, replacementHeader) + '\n}\n';

fs.writeFileSync('src/lib/seed-data.ts', updatedCode);
console.log('src/lib/seed-data.ts successfully updated with all districts & panchayats!');
