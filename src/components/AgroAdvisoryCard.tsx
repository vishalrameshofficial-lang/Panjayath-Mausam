'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Droplet, Sprout, Wind, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AgroAdvisory } from '@/lib/agro-rules';

interface AgroAdvisoryCardProps {
  advisory: AgroAdvisory;
  panchayatName: string;
}

export default function AgroAdvisoryCard({ advisory, panchayatName }: AgroAdvisoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(advisory.audioScript);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const getRiskBadge = () => {
    switch (advisory.riskLevel) {
      case 'CRITICAL':
        return <span className="badge badge-rose"><AlertTriangle size={12} /> Critical Weather Risk</span>;
      case 'HIGH':
        return <span className="badge badge-amber"><AlertTriangle size={12} /> High Alert</span>;
      case 'MODERATE':
        return <span className="badge badge-cyan"><AlertTriangle size={12} /> Moderate Alert</span>;
      default:
        return <span className="badge badge-emerald"><ShieldCheck size={12} /> Favorable Conditions</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Sprout size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {advisory.cropName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Stage: {advisory.stage} | Panchayat: {panchayatName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {getRiskBadge()}
          {/* Audio Narration Button */}
          <button
            onClick={handleSpeak}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: isPlaying ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              color: isPlaying ? '#fb7185' : '#34d399',
              border: isPlaying ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isPlaying ? 'Stop Audio' : 'Listen Voice'}</span>
          </button>
        </div>
      </div>

      {/* General Narrative */}
      <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '20px' }}>
        {advisory.generalAdvisory}
      </p>

      {/* Three Pillars: Irrigation, Spraying, Harvesting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Irrigation Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplet size={14} /> Irrigation Decision
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              {advisory.irrigation.action}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {advisory.irrigation.recommendation}
          </p>
        </div>

        {/* Chemical Spraying Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={14} /> Pesticide / Fertilizer Spray
            </span>
            <span className={advisory.spraying.isSafeToSpray ? 'badge badge-emerald' : 'badge badge-rose'} style={{ fontSize: '0.65rem' }}>
              {advisory.spraying.isSafeToSpray ? 'SAFE TO SPRAY' : 'HOLD SPRAYING'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {advisory.spraying.recommendation}
          </p>
        </div>

        {/* Harvest & Field Protection Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Harvesting Guidance
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              {advisory.harvesting.action}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {advisory.harvesting.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
