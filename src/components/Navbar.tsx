'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloudSun, ShieldCheck, MapPin, Globe, User, Terminal, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<'USER' | 'DATA_ANALYST' | 'ADMIN' | 'SUPER_ADMIN'>('USER');
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('pm_user_role') as any;
    if (savedRole) setCurrentRole(savedRole);
    const savedLang = localStorage.getItem('pm_lang') as any;
    if (savedLang) setLang(savedLang);
  }, []);

  const handleRoleChange = (role: 'USER' | 'DATA_ANALYST' | 'ADMIN' | 'SUPER_ADMIN') => {
    setCurrentRole(role);
    localStorage.setItem('pm_user_role', role);
    setShowRoleMenu(false);
    window.dispatchEvent(new Event('roleChange'));
  };

  const handleLangChange = (newLang: 'en' | 'hi' | 'mr') => {
    setLang(newLang);
    localStorage.setItem('pm_lang', newLang);
    window.dispatchEvent(new Event('langChange'));
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(7, 13, 24, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}>
            <CloudSun size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                Panchayat<span className="gradient-text-emerald">Mausam</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>SIH26074</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Official Block-to-Panchayat AI Downscaling
            </div>
          </div>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: pathname === '/' ? '#34d399' : 'var(--text-muted)',
              background: pathname === '/' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            Home
          </Link>

          <Link
            href="/user"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: pathname === '/user' ? '#38bdf8' : 'var(--text-muted)',
              background: pathname === '/user' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            Panchayat Weather & Advisory
          </Link>

          <Link
            href="/admin"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: pathname === '/admin' ? '#fbbf24' : 'var(--text-muted)',
              background: pathname === '/admin' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <ShieldCheck size={16} />
            Administration & ML Ops
          </Link>
        </nav>

        {/* Controls: Language & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => handleLangChange('en')}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                color: lang === 'en' ? '#fff' : 'var(--text-dim)',
                background: lang === 'en' ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
              }}
            >
              EN
            </button>
            <button
              onClick={() => handleLangChange('hi')}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                color: lang === 'hi' ? '#fff' : 'var(--text-dim)',
                background: lang === 'hi' ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
              }}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLangChange('mr')}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                color: lang === 'mr' ? '#fff' : 'var(--text-dim)',
                background: lang === 'mr' ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
              }}
            >
              मराठी
            </button>
          </div>

          {/* Role Indicator / Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <User size={14} color="#34d399" />
              <span>Role: <strong style={{ color: currentRole === 'USER' ? '#38bdf8' : '#fbbf24' }}>{currentRole}</strong></span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {showRoleMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '210px',
                  padding: '8px',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Simulate RBAC Profile:
                </div>
                {(['USER', 'DATA_ANALYST', 'ADMIN', 'SUPER_ADMIN'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: currentRole === role ? 700 : 500,
                      color: currentRole === role ? '#10b981' : 'var(--text-main)',
                      background: currentRole === role ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                    }}
                  >
                    {role === 'USER' && '👤 Citizen / Farmer'}
                    {role === 'DATA_ANALYST' && '📊 Data Analyst'}
                    {role === 'ADMIN' && '⚡ Taluka Admin'}
                    {role === 'SUPER_ADMIN' && '🛡️ Super Admin'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
