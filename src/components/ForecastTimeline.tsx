'use client';

import React, { useState } from 'react';
import { Calendar, TrendingUp, Droplets, Wind, ShieldAlert, Cpu } from 'lucide-react';
import { DownscaledForecastItem } from '@/lib/downscaler';

interface ForecastTimelineProps {
  forecasts: DownscaledForecastItem[];
  modelVersion: string;
  confidenceMethod: string;
}

export default function ForecastTimeline({
  forecasts,
  modelVersion,
  confidenceMethod
}: ForecastTimelineProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--rose-accent)' }}>Panchayat-level AI forecast is currently unavailable.</p>
      </div>
    );
  }

  // Group forecasts by Day (using local dates)
  const dayGroups: { [key: string]: DownscaledForecastItem[] } = {};
  forecasts.forEach(f => {
    const dayKey = new Date(f.time).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
    dayGroups[dayKey].push(f);
  });

  const dayKeys = Object.keys(dayGroups).slice(0, 5); // 5 days max
  const activeDayKey = dayKeys[selectedDayIndex] || dayKeys[0];
  const activeDayItems = dayGroups[activeDayKey] || [];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header & Model Metadata */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>5-Day Hyperlocal Downscaled Timeline</h3>
            <span className="badge badge-emerald">
              <Cpu size={12} /> {modelVersion}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comparative Baseline (Block Regional Grid) vs. Downscaled Panchayat Forecast with Calibrated Conformal Intervals.
          </p>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
          <div>Uncertainty Calibration: <strong>{confidenceMethod}</strong></div>
          <div>Baseline: <strong>IMD NWP Regional Block Model</strong></div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {dayKeys.map((dayKey, idx) => {
          const items = dayGroups[dayKey];
          const avgTemp = (items.reduce((s, i) => s + i.downscaledTemp, 0) / items.length).toFixed(1);
          const totalRain = items.reduce((s, i) => s + i.downscaledRain, 0).toFixed(1);
          const isSelected = idx === selectedDayIndex;

          return (
            <button
              key={dayKey}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                flex: '1 0 140px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: isSelected ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#34d399' : 'var(--text-muted)', marginBottom: '4px' }}>
                {dayKey}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                {avgTemp}°C
              </div>
              <div style={{ fontSize: '0.75rem', color: Number(totalRain) > 0 ? '#38bdf8' : 'var(--text-dim)', marginTop: '2px' }}>
                {Number(totalRain) > 0 ? `Rain: ${totalRain}mm` : 'Dry day'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hourly Card Strip for Selected Day */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {activeDayItems.filter((_, i) => i % 3 === 0).slice(0, 8).map((item, i) => {
          const hourText = new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isCooler = item.tempDelta < 0;

          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{hourText}</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{item.condition}</span>
              </div>

              {/* Downscaled Temp */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {item.downscaledTemp}°C
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: isCooler ? '#38bdf8' : '#fbbf24'
                }}>
                  {item.tempDelta >= 0 ? `+${item.tempDelta}°` : `${item.tempDelta}°`}
                </span>
              </div>

              {/* Baseline vs Downscaled Comparison */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Block Base: <strong style={{ color: 'var(--text-muted)' }}>{item.baselineTemp}°C</strong>
              </div>

              {/* 95% Conformal Confidence Bound */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px 6px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                marginBottom: '8px'
              }}>
                95% CI: <span style={{ color: '#34d399' }}>{item.uncertaintyLowerTemp}° - {item.uncertaintyUpperTemp}°C</span>
              </div>

              {/* Rain & Wind */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={12} color="#38bdf8" /> {item.downscaledRain} mm
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={12} color="#a5b4fc" /> {item.downscaledWind} km/h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
