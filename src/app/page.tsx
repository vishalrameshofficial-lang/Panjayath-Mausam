'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CloudSun,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Mountain,
  Compass,
  Cpu,
  Sprout,
  BarChart3,
  Search,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [featuredPanchayats, setFeaturedPanchayats] = useState<any[]>([]);

  useEffect(() => {
    // Load sampled panchayats from GIS API
    fetch('/api/gis?type=panchayats')
      .then(res => res.json())
      .then(data => {
        if (data.panchayats) {
          setFeaturedPanchayats(data.panchayats.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/gis?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPanchayat = (id: string) => {
    router.push(`/user?panchayatId=${id}`);
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '90px 0 80px 0',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent 70%)'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} className="pulse-live"></span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                Smart India Hackathon SIH26074 • Authoritative Weather Intelligence
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '20px'
            }}>
              Panchayat-Level Weather Intelligence for <span className="gradient-text-emerald">India</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '36px',
              fontWeight: 400
            }}>
              Transforming official block-level weather forecasts into useful Gram Panchayat-level intelligence using real meteorological observations, GIS elevation grids, topoclimatic physics, and scientifically calibrated AI downscaling.
            </p>

            {/* Quick Panchayat Search Box */}
            <div style={{
              maxWidth: '640px',
              margin: '0 auto 36px auto',
              position: 'relative'
            }}>
              <div className="glass-panel" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '16px',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}>
                <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="Search Gram Panchayat, Block, or District (e.g. Malegaon, Pandoh, Katewadi)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  maxHeight: '320px',
                  overflowY: 'auto',
                  padding: '8px',
                  textAlign: 'left'
                }}>
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectPanchayat(item.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          Block: {item.block_name} • District: {item.district_name} • State: {item.state_name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{item.elevation_m}m</span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              <Link href="/user" className="btn-primary">
                <span>Check Panchayat Weather</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/admin" className="btn-secondary">
                <ShieldCheck size={18} color="#fbbf24" />
                <span>Administration & Model Ops</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY DOWNSCALING MATTERS: THE PROBLEM STATEMENT */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px auto' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>The Science of Downscaling</span>
            <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '16px' }}>
              Why Block Forecasts Fail at the Gram Panchayat Level
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
              A single Indian Block spans over 200–800 km² and contains 20 to 60 Gram Panchayats. Regional Numerical Weather Prediction (NWP) outputs one single forecast for the entire block. Yet, local topography causes massive micro-climate differences.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Factor 1: Lapse Rate */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '18px' }}>
                <Mountain size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>
                Environmental Lapse Rate
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
                Temperature drops by ~6.5°C per 1,000 meters of elevation ascent. In mountainous or plateau blocks, an uphill panchayat (e.g. 1,800m) can be 8°C to 12°C colder than a valley panchayat in the very same block.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                Physics Formulation: ΔT = -Γ · Δz (Γ ≈ 0.0065 °C/m)
              </div>
            </div>

            {/* Factor 2: Slope & Aspect */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: '18px' }}>
                <Compass size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>
                Solar Radiation & Aspect
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
                South-facing slopes in India absorb up to 40% more solar insolation during daytime than north-facing shaded slopes. This directly drives higher soil evaporation and localized heat stress.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                Insolation Factor: cos(aspect - π) · sin(slope)
              </div>
            </div>

            {/* Factor 3: Orographic Precipitation */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '18px' }}>
                <CloudSun size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>
                Orographic Lift vs. Rain Shadow
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
                Moist monsoon air forced upward along windward ridges condenses into intense localized showers, while leeward panchayats just 5 km away remain completely dry in the rain shadow.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                Vector Alignment: Orographic Lift α · (W · ∇z)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE SYSTEM WORKS: 4-STEP PIPELINE */}
      <section className="section-padding" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px auto' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Operational Architecture</span>
            <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '16px' }}>
              How PanchayatMausam Generates Hyperlocal Intelligence
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
              Built strictly without simulated numbers or fake mock data. Every prediction is derived through a traceable, calibrated pipeline.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Step 01</span>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>Official Data Ingestion</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Ingests live meteorological feeds from IMD AWS network, NCMRWF regional grids, and global NWP ensembles with request validation and quality checks.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Step 02</span>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>GIS Topographic Context</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Enriches each Panchayat with authentic LGD codes, high-resolution SRTM/ISRO DEM elevations, slope angle, aspect orientation, and water proximity.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="badge badge-indigo" style={{ marginBottom: '12px' }}>Step 03</span>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>AI Downscaling Inference</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Gradient Boosting Regressor calculates micro-climate deltas against the block baseline, providing 95% conformal uncertainty intervals.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="badge badge-amber" style={{ marginBottom: '12px' }}>Step 04</span>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>Actionable Agro-Advisory</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Transforms downscaled weather into crop-specific irrigation scheduling, spray drift warnings, and harvest alerts with voice readout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE PANCHAYATS DIRECT ACCESS */}
      <section className="section-padding">
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '36px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#fff' }}>Explore Panchayats Across Agro-Climatic Zones</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Authoritative administrative geography across Himalayan, Gangetic, Deccan, Arid, and Western Ghats terrains.
              </p>
            </div>
            <Link href="/user" className="btn-outline-cyan">
              <span>View All Panchayats</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {featuredPanchayats.map((p) => (
              <div
                key={p.id}
                onClick={() => selectPanchayat(p.id)}
                className="glass-panel"
                style={{
                  padding: '22px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '4px' }}>{p.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>LGD Code: {p.official_code}</div>
                  </div>
                  <span className="badge badge-emerald">{p.elevation_m}m</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                  Slope: {p.slope_deg}° • Aspect: {p.aspect_deg}° • {p.land_cover}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>View Downscaled Weather</span>
                  <ChevronRight size={16} color="#38bdf8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
