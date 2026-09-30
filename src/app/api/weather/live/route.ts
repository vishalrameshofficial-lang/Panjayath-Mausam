import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { WeatherProviderService } from '@/lib/weather-provider';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET(request: Request) {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const panchayatId = searchParams.get('panchayatId');

    if (!panchayatId) {
      return NextResponse.json({ error: 'panchayatId is required' }, { status: 400 });
    }

    const panchayat = db.prepare(`
      SELECT p.*, b.name as block_name, b.id as block_id, b.centroid_lat as block_lat, b.centroid_lon as block_lon
      FROM panchayats p
      JOIN blocks b ON p.block_id = b.id
      WHERE p.id = ?
    `).get(panchayatId) as any;

    if (!panchayat) {
      return NextResponse.json({ error: 'Panchayat not found' }, { status: 404 });
    }

    // Call official meteorological provider service
    const weatherResult = await WeatherProviderService.fetchOfficialWeather(
      panchayat.id,
      panchayat.centroid_lat,
      panchayat.centroid_lon,
      panchayat.block_id
    );

    if (!weatherResult.isAvailable) {
      return NextResponse.json({
        isAvailable: false,
        error: weatherResult.errorMessage || 'Official weather data is currently unavailable from meteorological servers.',
        panchayat: {
          id: panchayat.id,
          name: panchayat.name,
          block: panchayat.block_name
        }
      }, { status: 503 });
    }

    return NextResponse.json({
      isAvailable: true,
      panchayat: {
        id: panchayat.id,
        name: panchayat.name,
        officialCode: panchayat.official_code,
        blockName: panchayat.block_name,
        elevationM: panchayat.elevation_m,
        lat: panchayat.centroid_lat,
        lon: panchayat.centroid_lon
      },
      observation: weatherResult.currentObservation,
      sourceMetadata: weatherResult.sourceMetadata
    });

  } catch (error: any) {
    return NextResponse.json({
      isAvailable: false,
      error: 'Official weather data processing error: ' + (error?.message || 'Server error')
    }, { status: 500 });
  }
}
