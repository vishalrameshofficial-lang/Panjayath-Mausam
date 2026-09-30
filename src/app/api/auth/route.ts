import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET() {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const users = db.prepare('SELECT id, email, name, role, created_at FROM system_users').all();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const body = await request.json();
    const { email } = body;

    const user = db.prepare('SELECT id, email, name, role FROM system_users WHERE email = ?').get(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
