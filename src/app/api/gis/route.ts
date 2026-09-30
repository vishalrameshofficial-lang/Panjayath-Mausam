import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET(request: Request) {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'hierarchy';
    const stateId = searchParams.get('stateId');
    const districtId = searchParams.get('districtId');
    const blockId = searchParams.get('blockId');
    const panchayatId = searchParams.get('panchayatId');
    const query = searchParams.get('q');

    if (panchayatId) {
      const panchayat = db.prepare(`
        SELECT p.*, b.name as block_name, b.official_code as block_code,
               d.name as district_name, d.official_code as district_code,
               s.name as state_name, s.official_code as state_code
        FROM panchayats p
        JOIN blocks b ON p.block_id = b.id
        JOIN districts d ON b.district_id = d.id
        JOIN states s ON d.state_id = s.id
        WHERE p.id = ?
      `).get(panchayatId);

      if (!panchayat) {
        return NextResponse.json({ error: 'Panchayat not found' }, { status: 404 });
      }

      return NextResponse.json({ panchayat });
    }

    if (query) {
      const results = db.prepare(`
        SELECT p.id, p.name, p.official_code, p.elevation_m, p.centroid_lat, p.centroid_lon,
               b.name as block_name, d.name as district_name, s.name as state_name
        FROM panchayats p
        JOIN blocks b ON p.block_id = b.id
        JOIN districts d ON b.district_id = d.id
        JOIN states s ON d.state_id = s.id
        WHERE p.name LIKE ? OR b.name LIKE ? OR d.name LIKE ?
        LIMIT 10
      `).all(`%${query}%`, `%${query}%`, `%${query}%`);

      return NextResponse.json({ results });
    }

    if (type === 'states') {
      const states = db.prepare('SELECT * FROM states ORDER BY name ASC').all();
      return NextResponse.json({ states });
    }

    if (type === 'districts') {
      const stmt = stateId 
        ? db.prepare('SELECT * FROM districts WHERE state_id = ? ORDER BY name ASC')
        : db.prepare('SELECT * FROM districts ORDER BY name ASC');
      const districts = stateId ? stmt.all(stateId) : stmt.all();
      return NextResponse.json({ districts });
    }

    if (type === 'blocks') {
      const stmt = districtId 
        ? db.prepare('SELECT * FROM blocks WHERE district_id = ? ORDER BY name ASC')
        : db.prepare('SELECT * FROM blocks ORDER BY name ASC');
      const blocks = districtId ? stmt.all(districtId) : stmt.all();
      return NextResponse.json({ blocks });
    }

    if (type === 'panchayats') {
      const stmt = blockId 
        ? db.prepare('SELECT id, official_code, block_id, name, centroid_lat, centroid_lon, elevation_m, slope_deg, aspect_deg, land_cover, geometry_geojson FROM panchayats WHERE block_id = ? ORDER BY name ASC')
        : db.prepare('SELECT id, official_code, block_id, name, centroid_lat, centroid_lon, elevation_m, slope_deg, aspect_deg, land_cover, geometry_geojson FROM panchayats ORDER BY name ASC');
      const panchayats = blockId ? stmt.all(blockId) : stmt.all();
      return NextResponse.json({ panchayats });
    }

    // Default full hierarchy overview
    const states = db.prepare('SELECT * FROM states ORDER BY name ASC').all();
    const districts = db.prepare('SELECT * FROM districts ORDER BY name ASC').all();
    const blocks = db.prepare('SELECT * FROM blocks ORDER BY name ASC').all();
    const panchayats = db.prepare('SELECT id, official_code, block_id, name, centroid_lat, centroid_lon, elevation_m, slope_deg, aspect_deg, land_cover FROM panchayats ORDER BY name ASC').all();

    return NextResponse.json({
      states,
      districts,
      blocks,
      panchayats
    });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'GIS Query Error' }, { status: 500 });
  }
}
