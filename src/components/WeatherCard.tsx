import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WeatherCardProps {
  title: string;
  value: string | number | null;
  unit: string;
  icon: LucideIcon;
  colorTheme: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose';
  deltaText?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  provenance: string;
  lastUpdated?: string;
}

export default function WeatherCard({
  title,
  value,
  unit,
  icon: Icon,
  colorTheme,
  deltaText,
  deltaType = 'neutral',
  provenance,
  lastUpdated
}: WeatherCardProps) {
  const getThemeColors = () => {
    switch (colorTheme) {
      case 'emerald':
        return { iconBg: 'rgba(16, 185, 129, 0.15)', iconColor: '#34d399', border: 'rgba(16, 185, 129, 0.25)' };
      case 'cyan':
        return { iconBg: 'rgba(6, 182, 212, 0.15)', iconColor: '#38bdf8', border: 'rgba(6, 182, 212, 0.25)' };
      case 'amber':
        return { iconBg: 'rgba(245, 158, 11, 0.15)', iconColor: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' };
      case 'rose':
        return { iconBg: 'rgba(244, 63, 94, 0.15)', iconColor: '#fb7185', border: 'rgba(244, 63, 94, 0.25)' };
      case 'indigo':
      default:
        return { iconBg: 'rgba(99, 102, 241, 0.15)', iconColor: '#a5b4fc', border: 'rgba(99, 102, 241, 0.25)' };
    }
  };

  const theme = getThemeColors();

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      borderColor: theme.border
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: theme.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.iconColor
        }}>
          <Icon size={18} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
        {value !== null && value !== undefined ? (
          <>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {value}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {unit}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '1rem', color: 'var(--rose-accent)', fontWeight: 600 }}>
            Official Data Unavailable
          </span>
        )}
      </div>

      {deltaText && (
        <div style={{
          fontSize: '0.78rem',
          padding: '4px 8px',
          borderRadius: '6px',
          marginBottom: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: deltaType === 'negative' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          color: deltaType === 'negative' ? '#38bdf8' : '#fbbf24'
        }}>
          <span>{deltaText}</span>
        </div>
      )}

      <div style={{
        paddingTop: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-dim)'
      }}>
        <span>Source: <strong>{provenance}</strong></span>
        {lastUpdated && <span>Sync: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </div>
  );
}
