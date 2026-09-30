import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { WeatherProviderService } from '@/lib/weather-provider';
import { DownscalerService } from '@/lib/downscaler';
import { AgroAdvisoryEngine } from '@/lib/agro-rules';
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
      SELECT p.*, b.name as block_name
      FROM panchayats p
      JOIN blocks b ON p.block_id = b.id
      WHERE p.id = ?
    `).get(panchayatId) as any;

    if (!panchayat) {
      return NextResponse.json({ error: 'Panchayat not found' }, { status: 404 });
    }

    // Fetch official weather
    const weatherResult = await WeatherProviderService.fetchOfficialWeather(
      panchayat.id,
      panchayat.centroid_lat,
      panchayat.centroid_lon,
      panchayat.block_id
    );

    if (!weatherResult.isAvailable || !weatherResult.forecast) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Official weather data unavailable. Agro-advisory requires active meteorological forecast.'
      }, { status: 503 });
    }

    // Downscale
    const downscaledData = await DownscalerService.downscale(panchayat.id, weatherResult.forecast);
    if (!downscaledData) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Downscaling calculation failed.'
      }, { status: 500 });
    }

    // Generate advisories
    const advisories = AgroAdvisoryEngine.generateAdvisories(
      panchayat.land_cover,
      downscaledData.forecasts
    );

    return NextResponse.json({
      isAvailable: true,
      panchayatName: panchayat.name,
      landCover: panchayat.land_cover,
      advisories,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      isAvailable: false,
      error: 'Agro-advisory error: ' + (error?.message || 'Server error')
    }, { status: 500 });
  }
}
