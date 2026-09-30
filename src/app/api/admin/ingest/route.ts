import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { WeatherProviderService } from '@/lib/weather-provider';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET() {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    
    const sources = db.prepare('SELECT * FROM weather_sources ORDER BY name ASC').all();
    const logs = db.prepare(`
      SELECT l.*, s.name as source_name
      FROM weather_ingestion_logs l
      LEFT JOIN weather_sources s ON l.source_id = s.id
      ORDER BY l.timestamp DESC
      LIMIT 25
    `).all();

    const stats = {
      totalObservations: (db.prepare('SELECT count(*) as c FROM weather_observations').get() as any).c,
      totalForecasts: (db.prepare('SELECT count(*) as c FROM weather_forecasts').get() as any).c,
      totalPanchayats: (db.prepare('SELECT count(*) as c FROM panchayats').get() as any).c
    };

    return NextResponse.json({ sources, logs, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const body = await request.json().catch(() => ({}));
    const { role } = body;

    if (role !== 'DATA_ANALYST' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Ingestion trigger requires DATA_ANALYST, ADMIN, or SUPER_ADMIN role.' }, { status: 403 });
    }

    // Trigger sync for all active Panchayats
    const panchayats = db.prepare(`
      SELECT p.*, b.id as block_id FROM panchayats p JOIN blocks b ON p.block_id = b.id LIMIT 5
    `).all() as any[];

    let successCount = 0;
    for (const p of panchayats) {
      const res = await WeatherProviderService.fetchOfficialWeather(p.id, p.centroid_lat, p.centroid_lon, p.block_id);
      if (res.isAvailable) successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Refreshed official data for ${successCount}/${panchayats.length} sampled Panchayat nodes.`,
      syncedAt: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
