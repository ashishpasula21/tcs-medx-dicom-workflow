import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

interface Alert {
  id: number;
  screen: number;
  level: 'err' | 'warn' | 'info';
  title: string;
  msg: string;
  time: string;
}

const ALL_ALERTS: Alert[] = [
  { id: 1, screen: 3, level: 'err',  title: 'Image corruption detected',        msg: 'File IM-0023-0041.dcm CRC mismatch — flagged for re-upload from CRO.',                   time: '2m ago' },
  { id: 2, screen: 2, level: 'warn', title: 'De-identification SLA breach',      msg: 'PHI removal step exceeded target latency by 2.3s on 4 series.',                          time: '6m ago' },
  { id: 3, screen: 4, level: 'warn', title: 'SOP acknowledgement overdue',       msg: 'Reader Dr. Smith has not acknowledged SOP-IMG-001 (48h overdue). Case blocked.',          time: '12m ago' },
  { id: 4, screen: 1, level: 'warn', title: 'Metadata template mismatch',        msg: 'Study template v2.1 differs from CRO submission schema v2.3. 3 fields unmapped.',         time: '18m ago' },
  { id: 5, screen: 5, level: 'warn', title: 'Annotation session expiring',       msg: 'Active reader annotation session will timeout in 15 minutes due to inactivity.',          time: '21m ago' },
  { id: 6, screen: 9, level: 'warn', title: 'Model drift trending upward',       msg: 'KL divergence increased 18% over 7 days. Performance review recommended.',               time: '35m ago' },
  { id: 7, screen: 8, level: 'info', title: 'QA review pending 48h',             msg: 'Model validation package awaiting QA sign-off since yesterday 09:14.',                    time: '1h ago' },
  { id: 8, screen: 7, level: 'info', title: 'New algorithm version available',   msg: 'EfficientNet-B5 v2.1 is available in the workbench. Benchmark shows +1.4% AUC.',          time: '2h ago' },
  { id: 9, screen: 6, level: 'info', title: 'Biomarker dataset update available', msg: 'Biomarker dataset v2.0 released. Re-link IDP to include latest panel data.',             time: '3h ago' },
  { id: 10, screen: 3, level: 'info', title: 'FAIR re-assessment scheduled',     msg: 'Quarterly FAIR compliance re-assessment is due in 5 days per governance policy.',         time: '5h ago' },
];

const SCREEN_NAMES: Record<number, string> = {
  1: 'Study Onboarding', 2: 'Ingestion Pipeline', 3: 'QC & FAIR',
  4: 'Reading Center', 5: 'Reader Annotation', 6: 'IDP Creation',
  7: 'Algorithm Workbench', 8: 'GxP Promotion', 9: 'Deployment', 10: 'Business Outcomes',
};

const LEVEL_LABEL: Record<string, string> = { err: 'Error', warn: 'Warning', info: 'Info' };

export default function AlertsPanel() {
  const { alertsOpen, setAlertsOpen } = useWorkflow();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'err' | 'warn' | 'info'>('all');

  const visible = ALL_ALERTS.filter(a => !dismissed.includes(a.id) && (filter === 'all' || a.level === filter));
  const counts = {
    err: ALL_ALERTS.filter(a => !dismissed.includes(a.id) && a.level === 'err').length,
    warn: ALL_ALERTS.filter(a => !dismissed.includes(a.id) && a.level === 'warn').length,
    info: ALL_ALERTS.filter(a => !dismissed.includes(a.id) && a.level === 'info').length,
  };
  const totalActive = counts.err + counts.warn + counts.info;

  if (!alertsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setAlertsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 400 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 400, maxWidth: '92vw',
        height: '100vh', background: '#fff', borderLeft: '2px solid #000',
        zIndex: 401, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>System Alerts</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              Notifications
              {totalActive > 0 && (
                <span style={{ marginLeft: 10, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                  {totalActive}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setAlertsOpen(false)} style={{ background: 'none', border: '1px solid #000', width: 30, height: 30, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
          {(['all', 'err', 'warn', 'info'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, padding: '9px 4px', background: filter === f ? '#000' : '#fff',
                color: filter === f ? '#fff' : '#555', border: 'none',
                borderRight: '1px solid #ddd', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              {f === 'all' ? `All (${totalActive})` : f === 'err' ? `Errors (${counts.err})` : f === 'warn' ? `Warnings (${counts.warn})` : `Info (${counts.info})`}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visible.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#999', fontSize: 13 }}>
              No {filter === 'all' ? '' : filter} alerts
            </div>
          ) : (
            visible.map(alert => (
              <div key={alert.id} style={{
                borderLeft: `4px solid ${alert.level === 'err' ? 'var(--err)' : alert.level === 'warn' ? 'var(--warn)' : '#3b82f6'}`,
                borderBottom: '1px solid #eee',
                padding: '14px 16px',
                background: alert.level === 'err' ? '#fef2f2' : alert.level === 'warn' ? '#fefce8' : '#eff6ff',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: alert.level === 'err' ? 'var(--err)' : alert.level === 'warn' ? 'var(--warn)' : '#2563eb' }}>
                        {LEVEL_LABEL[alert.level]}
                      </span>
                      <span style={{ fontSize: 10, color: '#999', marginLeft: 'auto' }}>{alert.time}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{alert.title}</div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{alert.msg}</div>
                    <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>Screen {alert.screen}: {SCREEN_NAMES[alert.screen]}</div>
                  </div>
                  <button
                    onClick={() => setDismissed(prev => [...prev, alert.id])}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 14, padding: '0 2px', flexShrink: 0 }}
                    title="Dismiss"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {dismissed.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#999' }}>{dismissed.length} dismissed</span>
            <button onClick={() => setDismissed([])} style={{ background: 'none', border: '1px solid #ccc', padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Restore All</button>
          </div>
        )}
      </div>
    </>
  );
}
