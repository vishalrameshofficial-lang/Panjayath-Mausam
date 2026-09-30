'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Search,
  Droplets,
  Thermometer,
  Wind,
  Compass,
  Gauge,
  CloudSun,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  Sprout,
  HelpCircle,
  Volume2
} from 'lucide-react';
import WeatherMap from '@/components/WeatherMap';
import WeatherCard from '@/components/WeatherCard';
import ForecastTimeline from '@/components/ForecastTimeline';
import AgroAdvisoryCard from '@/components/AgroAdvisoryCard';
import { AgroAdvisory } from '@/lib/agro-rules';

export default function UserPortalPage() {
  return (
    <Suspense fallback={
      <div className="section-padding" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', marginBottom: '8px' }}>Loading Panchayat Intelligence...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving administrative GIS parameters and meteorological grid...</p>
        </div>
      </div>
    }>
      <UserPortalContent />
    </Suspense>
  );
}

function UserPortalContent() {
  const searchParams = useSearchParams();
  const initialPanchayatId = searchParams.get('panchayatId');

  // Administrative hierarchy states
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [panchayats, setPanchayats] = useState<any[]>([]);

  // Selected hierarchy
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>('');

  // Loaded Weather & Downscaling data
  const [selectedPanchayat, setSelectedPanchayat] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [advisoryData, setAdvisoryData] = useState<AgroAdvisory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load States on mount
  useEffect(() => {
    fetch('/api/gis?type=states')
      .then(res => res.json())
      .then(data => {
        if (data.states) {
          setStates(data.states);
          if (data.states.length > 0 && !selectedStateId) {
            setSelectedStateId(data.states[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // When state changes, fetch districts
  useEffect(() => {
    if (!selectedStateId) return;
    fetch(`/api/gis?type=districts&stateId=${selectedStateId}`)
      .then(res => res.json())
      .then(data => {
        if (data.districts) {
          setDistricts(data.districts);
          if (data.districts.length > 0) {
            setSelectedDistrictId(data.districts[0].id);
          }
        }
      });
  }, [selectedStateId]);

  // When district changes, fetch blocks
  useEffect(() => {
    if (!selectedDistrictId) return;
    fetch(`/api/gis?type=blocks&districtId=${selectedDistrictId}`)
      .then(res => res.json())
      .then(data => {
        if (data.blocks) {
          setBlocks(data.blocks);
          if (data.blocks.length > 0) {
            setSelectedBlockId(data.blocks[0].id);
          }
        }
      });
  }, [selectedDistrictId]);

  // When block changes, fetch panchayats
  useEffect(() => {
    if (!selectedBlockId) return;
    fetch(`/api/gis?type=panchayats&blockId=${selectedBlockId}`)
      .then(res => res.json())
      .then(data => {
        if (data.panchayats) {
          setPanchayats(data.panchayats);
          if (data.panchayats.length > 0) {
            // If query param provided matches, select that, otherwise select first
            if (initialPanchayatId && data.panchayats.some((p: any) => p.id === initialPanchayatId)) {
              setSelectedPanchayatId(initialPanchayatId);
            } else {
              setSelectedPanchayatId(data.panchayats[0].id);
            }
          }
        }
      });
  }, [selectedBlockId, initialPanchayatId]);

  // If initialPanchayatId was set directly, resolve its hierarchy
  useEffect(() => {
    if (!initialPanchayatId) return;
    fetch(`/api/gis?panchayatId=${initialPanchayatId}`)
      .then(res => res.json())
      .then(data => {
        if (data.panchayat) {
          setSelectedStateId(data.panchayat.state_id || 'st-mh');
          setSelectedDistrictId(data.panchayat.district_id || 'dst-pune');
          setSelectedBlockId(data.panchayat.block_id || 'blk-baramati');
          setSelectedPanchayatId(data.panchayat.id);
        }
      })
      .catch(() => {});
  }, [initialPanchayatId]);

  // Fetch Downscaled Weather & Agro-Advisory when selectedPanchayatId changes
  const fetchWeatherAndAdvisories = async (panchId: string) => {
    if (!panchId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch downscaled weather
      const weatherRes = await fetch(`/api/weather/downscale?panchayatId=${panchId}`);
      const weatherJson = await weatherRes.json();

      if (!weatherRes.ok || !weatherJson.isAvailable) {
        setErrorMessage(weatherJson.error || 'Official weather data is currently unavailable.');
        setWeatherData(null);
        setSelectedPanchayat(weatherJson.panchayat || null);
      } else {
        setWeatherData(weatherJson);
        setSelectedPanchayat(weatherJson.panchayat);
      }

      // 2. Fetch agro advisories
      const advRes = await fetch(`/api/advisory?panchayatId=${panchId}`);
      const advJson = await advRes.json();
      if (advRes.ok && advJson.advisories) {
        setAdvisoryData(advJson.advisories);
      } else {
        setAdvisoryData([]);
      }

    } catch (err: any) {
      setErrorMessage('Failed to connect to weather data services: ' + (err?.message || 'Network error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedPanchayatId) {
      fetchWeatherAndAdvisories(selectedPanchayatId);
    }
  }, [selectedPanchayatId]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedPanchayatId) {
      fetchWeatherAndAdvisories(selectedPanchayatId);
    }
  };

  return (
    <div className="section-padding" style={{ paddingTop: '40px' }}>
      <div className="container">
        
        {/* TOP BAR: HIERARCHY SELECTOR & SEARCH */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} color="#10b981" />
                <h1 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>
                  Gram Panchayat Weather & Agro-Advisory
                </h1>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official Local Government Directory (LGD) Hierarchy Selection
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              <RefreshCw size={15} className={refreshing ? 'pulse-live' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Official Feed'}</span>
            </button>
          </div>

          {/* 4-Level Dropdowns: State -> District -> Block -> Panchayat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* State */}
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                1. State
              </label>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                2. District
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Block */}
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                3. Block / Taluka
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Gram Panchayat */}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                4. Gram Panchayat
              </label>
              <select
                value={selectedPanchayatId}
                onChange={(e) => setSelectedPanchayatId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#fff',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {panchayats.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (LGD: {p.official_code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="pulse-live" style={{ display: 'inline-block', marginBottom: '16px' }}>
              <CloudSun size={48} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
              Retrieving Official IMD Weather & Running AI Downscaling...
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Applying environmental lapse rate (-6.5°C/km), slope-aspect insolation, and GBDT micro-climate inference.
            </p>
          </div>
        )}

        {/* ERROR OR UNAVAILABLE STATE */}
        {!loading && errorMessage && (
          <div className="glass-panel" style={{ padding: '32px', borderColor: 'var(--rose-accent)', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <AlertCircle size={24} color="#f43f5e" style={{ marginTop: '2px' }} />
              <div>
                <h3 style={{ color: '#fb7185', fontSize: '1.1rem', marginBottom: '4px' }}>Official Data Status</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {errorMessage}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  In accordance with strict system integrity rules, no simulated or fabricated weather numbers are displayed when official feeds are unavailable.
                </div>
                <button
                  onClick={handleRefresh}
                  className="btn-primary"
                  style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  <RefreshCw size={14} /> Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WEATHER DASHBOARD CONTENT */}
        {!loading && weatherData && weatherData.isAvailable && selectedPanchayat && (
          <>
            {/* LOCATION SUMMARY HEADER */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800 }}>
                    {selectedPanchayat.name}
                  </h2>
                  <span className="badge badge-emerald">LGD: {selectedPanchayat.officialCode}</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Block: <strong>{selectedPanchayat.blockName}</strong> • District: <strong>{selectedPanchayat.districtName}</strong> • State: <strong>{selectedPanchayat.stateName}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="badge badge-cyan">
                  Elevation: {selectedPanchayat.elevationM}m
                </span>
                <span className="badge badge-amber">
                  Slope: {selectedPanchayat.slopeDeg}° (Aspect {selectedPanchayat.aspectDeg}°)
                </span>
              </div>
            </div>

            {/* INTERACTIVE GIS MAP */}
            <div style={{ marginBottom: '28px' }}>
              <WeatherMap
                lat={selectedPanchayat.centroidLat}
                lon={selectedPanchayat.centroidLon}
                panchayatName={selectedPanchayat.name}
                blockName={selectedPanchayat.blockName}
                elevationM={selectedPanchayat.elevationM}
                slopeDeg={selectedPanchayat.slopeDeg}
                aspectDeg={selectedPanchayat.aspectDeg}
                geoJsonPolygon={selectedPanchayat.geometryGeojson}
                currentTemp={weatherData.currentObservation?.temperature}
                currentRain={weatherData.currentObservation?.rainfall}
              />
            </div>

            {/* LIVE WEATHER OBSERVATIONS GRID */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Official Current Observations</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Validated against IMD AWS criteria
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Temperature */}
                <WeatherCard
                  title="Current Temperature"
                  value={weatherData.currentObservation?.temperature}
                  unit="°C"
                  icon={Thermometer}
                  colorTheme="emerald"
                  deltaText={
                    weatherData.downscaled?.featuresUsed?.elevationDiffM
                      ? `${weatherData.downscaled.featuresUsed.elevationDiffM > 0 ? '-' : '+'}${(Math.abs(weatherData.downscaled.featuresUsed.elevationDiffM) * 0.0065).toFixed(1)}°C lapse vs Block`
                      : undefined
                  }
                  deltaType="negative"
                  provenance={weatherData.sourceMetadata?.source || 'IMD-AWS Network'}
                  lastUpdated={weatherData.currentObservation?.timestamp}
                />

                {/* Rainfall */}
                <WeatherCard
                  title="Precipitation"
                  value={weatherData.currentObservation?.rainfall}
                  unit="mm"
                  icon={Droplets}
                  colorTheme="cyan"
                  deltaText={Number(weatherData.currentObservation?.rainfall) > 0 ? 'Active rain gauge' : 'Dry atmospheric profile'}
                  provenance={weatherData.sourceMetadata?.source || 'IMD AWS'}
                  lastUpdated={weatherData.currentObservation?.timestamp}
                />

                {/* Relative Humidity */}
                <WeatherCard
                  title="Relative Humidity"
                  value={weatherData.currentObservation?.humidity}
                  unit="%"
                  icon={Gauge}
                  colorTheme="indigo"
                  provenance={weatherData.sourceMetadata?.source || 'IMD AWS'}
                  lastUpdated={weatherData.currentObservation?.timestamp}
                />

                {/* Wind Speed & Direction */}
                <WeatherCard
                  title="Wind Speed & Direction"
                  value={weatherData.currentObservation?.windSpeed}
                  unit="km/h"
                  icon={Wind}
                  colorTheme="amber"
                  deltaText={`Heading: ${weatherData.currentObservation?.windDirection ?? 0}°`}
                  provenance={weatherData.sourceMetadata?.source || 'IMD AWS'}
                  lastUpdated={weatherData.currentObservation?.timestamp}
                />
              </div>
            </div>

            {/* 5-DAY HYPERLOCAL DOWNSCALED TIMELINE */}
            <div style={{ marginBottom: '36px' }}>
              <ForecastTimeline
                forecasts={weatherData.downscaled?.forecasts || []}
                modelVersion={weatherData.downscaled?.modelVersion || 'v1.3.0'}
                confidenceMethod={weatherData.downscaled?.modelMetrics?.confidenceMethod || 'Conformal 95% Interval'}
              />
            </div>

            {/* HYPERLOCAL AGRO-ADVISORY SYSTEM */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sprout size={22} color="#10b981" />
                    <h3 style={{ fontSize: '1.35rem', color: '#fff' }}>Hyperlocal Crop Agro-Advisory</h3>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    ICAR GKMS Rules evaluated against downscaled micro-climate for {selectedPanchayat.name}.
                  </p>
                </div>
                <span className="badge badge-emerald">Land Cover: {selectedPanchayat.landCover}</span>
              </div>

              {advisoryData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {advisoryData.map((adv, idx) => (
                    <AgroAdvisoryCard
                      key={idx}
                      advisory={adv}
                      panchayatName={selectedPanchayat.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Awaiting latest downscaled forecasts to generate agronomic recommendations.
                </div>
              )}
            </div>

            {/* DOWNSCALING AUDIT & TRACEABILITY CARD */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(7, 13, 24, 0.6)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                Scientific Provenance & Traceability Ledger
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div>Source: <strong>{weatherData.sourceMetadata?.source}</strong></div>
                <div>Downscaler Model: <strong>{weatherData.downscaled?.modelVersion}</strong></div>
                <div>Model MAE: <strong>±{weatherData.downscaled?.modelMetrics?.maeTemp}°C</strong> (Skill: +{weatherData.downscaled?.modelMetrics?.skillScorePct}%)</div>
                <div>Elevation Delta: <strong>{weatherData.downscaled?.featuresUsed?.elevationDiffM}m</strong> vs Block Centroid</div>
                <div>Lapse Rate Applied: <strong>6.5°C / 1000m</strong></div>
                <div>Quality Status: <strong style={{ color: '#10b981' }}>{weatherData.sourceMetadata?.qualityStatus}</strong></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
