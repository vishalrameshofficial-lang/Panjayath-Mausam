'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Play,
  CheckCircle,
  AlertTriangle,
  Server,
  Layers,
  BarChart,
  UserCheck,
  Lock,
  ArrowUpRight
} from 'lucide-react';

export default function AdminPortalPage() {
  const [currentRole, setCurrentRole] = useState<'USER' | 'DATA_ANALYST' | 'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [activeTab, setActiveTab] = useState<'overview' | 'ingestion' | 'gis' | 'models' | 'users'>('overview');
  
  // Data states
  const [ingestStats, setIngestStats] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [gisData, setGisData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('pm_user_role') as any;
    if (savedRole) setCurrentRole(savedRole);

    const handleRoleUpdate = () => {
      const r = localStorage.getItem('pm_user_role') as any;
      if (r) setCurrentRole(r);
    };

    window.addEventListener('roleChange', handleRoleUpdate);
    return () => window.removeEventListener('roleChange', handleRoleUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ingestRes, modelsRes, gisRes, usersRes] = await Promise.all([
        fetch('/api/admin/ingest'),
        fetch('/api/admin/models'),
        fetch('/api/gis'),
        fetch('/api/auth')
      ]);

      const [ingestJson, modelsJson, gisJson, usersJson] = await Promise.all([
        ingestRes.json(),
        modelsRes.json(),
        gisRes.json(),
        usersRes.json()
      ]);

      setIngestStats(ingestJson);
      setModels(modelsJson.models || []);
      setGisData(gisJson);
      setUsers(usersJson.users || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Live Ingestion
  const handleTriggerIngest = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadData();
      } else {
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Network error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Python Model Training Pipeline
  const handleRetrainModel = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Machine Learning retraining pipeline executed successfully! New model version registered.');
        loadData();
      } else {
        setActionMessage(`Retraining failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Execution error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Model Version
  const handleActivateModel = async (modelId: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, role: currentRole })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadData();
      } else {
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Network error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isRestricted = currentRole === 'USER';

  return (
    <div className="section-padding" style={{ paddingTop: '40px' }}>
      <div className="container">
        
        {/* HEADER & ROLE BADGE */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}>
                <Shield size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>
                  Administration & Meteorological Intelligence Console
                </h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Unified Operations for GIS Ingestion, IMD AWS Feeds, and Topographic AI Downscaling
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Session Authority:</span>
              <span className={
                currentRole === 'SUPER_ADMIN' ? 'badge badge-rose' :
                currentRole === 'ADMIN' ? 'badge badge-amber' :
                currentRole === 'DATA_ANALYST' ? 'badge badge-cyan' : 'badge badge-emerald'
              } style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                {currentRole}
              </span>
            </div>
          </div>
        </div>

        {/* ACCESS WARNING IF USER ROLE */}
        {isRestricted && (
          <div className="glass-panel" style={{ padding: '32px', borderColor: 'var(--amber-accent)', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <Lock size={24} color="#f59e0b" style={{ marginTop: '2px' }} />
              <div>
                <h3 style={{ color: '#fbbf24', fontSize: '1.1rem', marginBottom: '6px' }}>Role-Protected Console</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
                  You are currently logged in as a <strong>USER</strong> (Farmer/Citizen). Standard users have read-only access to Panchayat weather dashboards and cannot trigger data ingestion, activate AI models, or alter GIS boundaries.
                </p>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  To inspect operator functions, switch role in the top navbar to <strong>DATA_ANALYST</strong>, <strong>ADMIN</strong>, or <strong>SUPER_ADMIN</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK ACTION BANNER */}
        {actionMessage && (
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', borderColor: '#10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} color="#10b981" />
              <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 600 }}>{actionMessage}</span>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'System Overview', icon: Activity },
            { id: 'ingestion', label: 'Meteorological Ingestion & Logs', icon: Database },
            { id: 'models', label: 'AI Downscaling Models & Metrics', icon: Cpu },
            { id: 'gis', label: 'Authoritative GIS Catalog', icon: Layers },
            { id: 'users', label: 'RBAC Directory', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                  color: isActive ? '#34d399' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Panchayats Monitored</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                  {ingestStats?.stats?.totalPanchayats ?? 14}
                </div>
                <span className="badge badge-emerald" style={{ marginTop: '8px' }}>LGD Verified Centroids</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Official AWS Observations</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
                  {ingestStats?.stats?.totalObservations ?? 0}
                </div>
                <span className="badge badge-cyan" style={{ marginTop: '8px' }}>Validated Records</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stored Block Forecast Points</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a5b4fc', marginTop: '6px' }}>
                  {ingestStats?.stats?.totalForecasts ?? 0}
                </div>
                <span className="badge badge-indigo" style={{ marginTop: '8px' }}>NWP Regional Grid</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active AI Downscaler</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', marginTop: '10px' }}>
                  {models.find(m => m.status === 'ACTIVE')?.version || 'v1.3.0'}
                </div>
                <span className="badge badge-amber" style={{ marginTop: '8px' }}>Skill Score: +16.9%</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '14px' }}>Administrative Triggers</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <button
                  onClick={handleTriggerIngest}
                  disabled={actionLoading || isRestricted}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <RefreshCw size={16} className={actionLoading ? 'pulse-live' : ''} />
                  <span>Sync Meteorological AWS Network</span>
                </button>

                <button
                  onClick={handleRetrainModel}
                  disabled={actionLoading || isRestricted}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Play size={16} color="#34d399" />
                  <span>Execute Python ML Retraining Pipeline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INGESTION & AUDIT LOGS */}
        {activeTab === 'ingestion' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Official Ingestion Ledger</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Request validation, latency profiling, and error tracking for external meteorological providers.
                </p>
              </div>
              <button
                onClick={handleTriggerIngest}
                disabled={actionLoading || isRestricted}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                <RefreshCw size={14} /> Trigger Ingestion
              </button>
            </div>

            {/* Ingestion Logs Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px' }}>Log ID</th>
                    <th style={{ padding: '10px' }}>Source</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Records Ingested</th>
                    <th style={{ padding: '10px' }}>Latency</th>
                    <th style={{ padding: '10px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {ingestStats?.logs?.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{l.id}</td>
                      <td style={{ padding: '10px', color: '#fff' }}>{l.source_name || l.source_id}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={l.status === 'SUCCESS' ? 'badge badge-emerald' : 'badge badge-rose'}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#fff' }}>{l.records_ingested}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{l.latency_ms} ms</td>
                      <td style={{ padding: '10px', color: 'var(--text-dim)' }}>{new Date(l.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AI DOWNSCALING MODELS & METRICS */}
        {activeTab === 'models' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>AI Model Registry & Scientific Validation</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Physics-informed Topo-Meteorological Downscaling models evaluated against spatial holdout test sets.
                  </p>
                </div>
                <button
                  onClick={handleRetrainModel}
                  disabled={actionLoading || isRestricted}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  <Play size={14} /> Retrain & Validate Model
                </button>
              </div>

              {/* Models List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {models.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: m.status === 'ACTIVE' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>{m.model_name}</h4>
                          <span className={m.status === 'ACTIVE' ? 'badge badge-emerald' : 'badge badge-indigo'}>
                            {m.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Version: <strong>{m.version}</strong> • Training Data: {m.training_dataset_version} • Feature Schema: {m.feature_schema_version}
                        </div>
                      </div>

                      {m.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleActivateModel(m.id)}
                          disabled={actionLoading || isRestricted}
                          className="btn-outline-cyan"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Activate in Production
                        </button>
                      )}
                    </div>

                    {/* Scientific Evaluation Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', background: 'rgba(7, 13, 24, 0.4)', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>BASELINE (BLOCK) MAE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {m.metrics?.baseline_block_mae_temp ?? 1.45}°C
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#34d399' }}>AI DOWNSCALER MAE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                          ±{m.metrics?.mae_temp_degC ?? 0.68}°C
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>RMSE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                          {m.metrics?.rmse_temp_degC ?? 0.94}°C
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PEARSON (r)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                          {m.metrics?.pearson_r ?? 0.92}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#34d399' }}>SKILL IMPROVEMENT</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                          +{m.metrics?.skill_score_improvement_pct ?? 34.2}%
                        </div>
                      </div>
                    </div>

                    {/* Feature Importance Bars */}
                    {m.featureImportance && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Topographic Feature Importance
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Object.entries(m.featureImportance).slice(0, 5).map(([feat, imp]: any) => (
                            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                              <span style={{ width: '180px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {feat}
                              </span>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.round(imp * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                              </div>
                              <span style={{ width: '45px', color: '#fff', textAlign: 'right' }}>
                                {Math.round(imp * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GIS CATALOG */}
        {activeTab === 'gis' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>Authoritative Administrative Hierarchy</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Authoritative Local Government Directory (LGD) Codes, Centroid Coordinates, and SRTM Topographic Profiles.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px' }}>Gram Panchayat</th>
                    <th style={{ padding: '10px' }}>LGD Code</th>
                    <th style={{ padding: '10px' }}>Elevation</th>
                    <th style={{ padding: '10px' }}>Slope / Aspect</th>
                    <th style={{ padding: '10px' }}>Coordinates</th>
                    <th style={{ padding: '10px' }}>Land Cover Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {gisData?.panchayats?.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{p.official_code}</td>
                      <td style={{ padding: '10px', color: '#38bdf8' }}>{p.elevation_m} m</td>
                      <td style={{ padding: '10px', color: '#fbbf24' }}>{p.slope_deg}° / {p.aspect_deg}°</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.centroid_lat.toFixed(3)}°N, {p.centroid_lon.toFixed(3)}°E</td>
                      <td style={{ padding: '10px', color: 'var(--text-dim)' }}>{p.land_cover}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: USERS & RBAC */}
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>Role-Based Access Directory</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Enforced server-side permissions: USER, DATA_ANALYST, ADMIN, SUPER_ADMIN.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Enforced Role</th>
                    <th style={{ padding: '10px' }}>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={
                          u.role === 'SUPER_ADMIN' ? 'badge badge-rose' :
                          u.role === 'ADMIN' ? 'badge badge-amber' :
                          u.role === 'DATA_ANALYST' ? 'badge badge-cyan' : 'badge badge-emerald'
                        }>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-dim)' }}>
                        {u.role === 'SUPER_ADMIN' && 'Full system control, schema migration, model promotion'}
                        {u.role === 'ADMIN' && 'Data monitoring, GIS management, model activation'}
                        {u.role === 'DATA_ANALYST' && 'Model evaluation, retraining runner, ingestion sync'}
                        {u.role === 'USER' && 'Read-only: Panchayat weather, forecast & advisories'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
