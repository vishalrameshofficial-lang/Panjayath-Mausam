import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { WeatherProviderService } from '@/lib/weather-provider';
import { DownscalerService } from '@/lib/downscaler';
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
      SELECT p.*, b.name as block_name, b.id as block_id, b.centroid_lat as block_lat, b.centroid_lon as block_lon,
             d.name as district_name, s.name as state_name
      FROM panchayats p
      JOIN blocks b ON p.block_id = b.id
      JOIN districts d ON b.district_id = d.id
      JOIN states s ON d.state_id = s.id
      WHERE p.id = ?
    `).get(panchayatId) as any;

    if (!panchayat) {
      return NextResponse.json({ error: 'Panchayat not found' }, { status: 404 });
    }

    // 1. Fetch official block weather & forecast
    const weatherResult = await WeatherProviderService.fetchOfficialWeather(
      panchayat.id,
      panchayat.centroid_lat,
      panchayat.centroid_lon,
      panchayat.block_id
    );

    if (!weatherResult.isAvailable || !weatherResult.forecast || weatherResult.forecast.length === 0) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Official block weather forecast is currently unavailable from meteorological services.',
        panchayat: {
          id: panchayat.id,
          name: panchayat.name,
          block: panchayat.block_name
        }
      }, { status: 503 });
    }

    // 2. Run Topographic AI Downscaler
    const downscaledData = await DownscalerService.downscale(panchayat.id, weatherResult.forecast);

    if (!downscaledData) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Downscaling model computation failed for this location.'
      }, { status: 500 });
    }

    return NextResponse.json({
      isAvailable: true,
      panchayat: {
        id: panchayat.id,
        name: panchayat.name,
        officialCode: panchayat.official_code,
        blockName: panchayat.block_name,
        districtName: panchayat.district_name,
        stateName: panchayat.state_name,
        elevationM: panchayat.elevation_m,
        slopeDeg: panchayat.slope_deg,
        aspectDeg: panchayat.aspect_deg,
        landCover: panchayat.land_cover,
        centroidLat: panchayat.centroid_lat,
        centroidLon: panchayat.centroid_lon,
        geometryGeojson: panchayat.geometry_geojson ? JSON.parse(panchayat.geometry_geojson) : null
      },
      currentObservation: weatherResult.currentObservation,
      downscaled: downscaledData,
      sourceMetadata: weatherResult.sourceMetadata
    });

  } catch (error: any) {
    return NextResponse.json({
      isAvailable: false,
      error: 'Downscaling pipeline error: ' + (error?.message || 'Server error')
    }, { status: 500 });
  }
}
