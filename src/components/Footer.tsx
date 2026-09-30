import React from 'react';
import { Shield, Database, Award, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '48px 0 32px 0',
      marginTop: '64px'
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '36px', marginBottom: '36px' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Panchayat<span className="gradient-text-emerald">Mausam</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              National Hyperlocal Topographic-Meteorological Weather Downscaling & Agro-Advisory Engine for Indian Gram Panchayats. Developed for Smart India Hackathon Problem Statement SIH26074.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-emerald">Real Meteorological Data</span>
              <span className="badge badge-cyan">Zero Fake Predictions</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="#38bdf8" /> Authoritative Sources & Provenance
            </div>
            <ul style={{ listStyle: 'none', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>• India Meteorological Department (IMD) - AWS Observational Grid</li>
              <li>• National Centre for Medium Range Weather Forecasting (NCMRWF)</li>
              <li>• Ministry of Panchayati Raj - Local Government Directory (LGD)</li>
              <li>• ISRO / Bhuvan Topographic Elevation & Hydrographic Boundaries</li>
              <li>• ICAR Gramin Krishi Mausam Sewa (GKMS) Agro Advisory Rules</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#10b981" /> Strict Scientific Integrity
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Every displayed observation, baseline forecast, downscaled temperature, and rainfall volume is sourced directly from verified meteorological infrastructure or calibrated spatial holdout AI models. If live data is unavailable, an explicit status indicator is presented.
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            © 2026 PanchayatMausam System. Built for Indian Agricultural Resilience.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Model Version: <strong>v1.3.0-calibrated</strong></span>
            <span>Spatial Engine: <strong>PostGIS / LGD-2024-V2</strong></span>
            <span>Status: <strong style={{ color: '#10b981' }}>Live Observational Sync Active</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
