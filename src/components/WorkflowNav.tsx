import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const STEPS = [
  { n: 1, label: 'Study Onboarding' },
  { n: 2, label: 'Ingestion Pipeline' },
  { n: 3, label: 'QC & FAIR' },
  { n: 4, label: 'Reading Center' },
  { n: 5, label: 'Reader Annotation' },
  { n: 6, label: 'IDP Creation' },
  { n: 7, label: 'Algorithm Workbench' },
  { n: 8, label: 'GxP Promotion' },
  { n: 9, label: 'Deployment' },
  { n: 10, label: 'Business Outcomes' },
];

function ResetModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', border: '2px solid #000', padding: '32px 36px',
        zIndex: 1000, width: 420, maxWidth: '90vw', boxShadow: '8px 8px 0 #000',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 12 }}>Confirm Reset</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>Restart Pipeline?</div>
        <div style={{ fontSize: 13, color: '#444', marginBottom: 24, lineHeight: 1.6 }}>
          This will permanently clear all progress — study data, annotations, approvals, and algorithm results. You will be returned to Screen 1.
        </div>
        <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #dc2626', color: '#7f1d1d', fontSize: 12, marginBottom: 24 }}>
          ⚠ This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', background: '#dc2626', color: '#fff', border: '1.5px solid #dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Yes, Reset Everything
          </button>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#000', border: '1.5px solid #000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default function WorkflowNav() {
  const { user, logoutUser, currentScreen, completedScreens, setCurrentScreen, resetPipeline, alertsOpen, setAlertsOpen } = useWorkflow();
  const [showReset, setShowReset] = useState(false);

  // Count undismissed alerts for badge (static count since AlertsPanel manages dismissed state)
  const alertCount = 10;

  return (
    <>
      <nav className="workflow-nav">
        {/* User badge */}
        {user && (
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: '#fff', color: '#000',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, flexShrink: 0,
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </div>
              <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={logoutUser}
              title="Sign out"
              style={{ background: 'none', border: '1px solid #333', color: '#888', cursor: 'pointer', fontSize: 10, padding: '3px 6px', fontFamily: 'inherit', flexShrink: 0 }}
            >
              OUT
            </button>
          </div>
        )}

        <div className="nav-brand">
          <div className="nav-brand-name">TCS-MEDX</div>
          <div className="nav-brand-sub">Clinical Imaging Platform</div>
        </div>

        <ul className="nav-steps">
          {STEPS.map(({ n, label }) => {
            const done = completedScreens.includes(n);
            const active = currentScreen === n;
            // Furthest accessible screen = highest completed + 1 (never shrinks when navigating back)
            const maxReached = completedScreens.length > 0 ? Math.max(...completedScreens) + 1 : 1;
            const accessible = n <= maxReached;
            const locked = !accessible;
            const cls = `nav-step ${active ? 'active' : done ? 'done' : locked ? 'locked' : ''}`;

            return (
              <li
                key={n}
                className={cls}
                style={{ cursor: accessible ? 'pointer' : 'not-allowed' }}
                onClick={() => { if (accessible) setCurrentScreen(n); }}
              >
                <div className="nav-step-num">{done ? '✓' : n}</div>
                <span className="nav-step-label">{label}</span>
                {locked && <span className="nav-step-status" title="Complete current step first">🔒</span>}
                {active && !done && <span className="nav-step-status">▶</span>}
              </li>
            );
          })}
        </ul>

        <div className="nav-footer">
          {/* Alerts button */}
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            style={{
              width: '100%', padding: '8px 0', marginBottom: 8,
              background: alertsOpen ? '#fff' : 'transparent',
              color: alertsOpen ? '#000' : '#aaa',
              border: '1px solid #444', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            🔔 Alerts
            <span style={{
              background: '#dc2626', color: '#fff', fontSize: 10,
              fontWeight: 900, padding: '1px 5px', borderRadius: 8,
            }}>{alertCount}</span>
          </button>

          <div style={{ marginBottom: 8, fontSize: 11, color: '#555' }}>
            Step {currentScreen} of {STEPS.length} &nbsp;·&nbsp; {completedScreens.length} done
          </div>

          <button
            onClick={() => setShowReset(true)}
            style={{
              width: '100%', padding: '7px 0', background: 'transparent',
              color: '#888', border: '1px solid #333', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#dc2626'; b.style.color = '#fff'; b.style.borderColor = '#dc2626'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#888'; b.style.borderColor = '#333'; }}
          >
            ↺ Restart Pipeline
          </button>
        </div>
      </nav>

      {showReset && <ResetModal onConfirm={() => { resetPipeline(); setShowReset(false); }} onCancel={() => setShowReset(false)} />}
    </>
  );
}
