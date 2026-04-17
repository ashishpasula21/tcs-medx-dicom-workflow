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
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 999,
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        border: '2px solid #000',
        padding: '32px 36px',
        zIndex: 1000,
        width: 420,
        maxWidth: '90vw',
        boxShadow: '8px 8px 0 #000',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 12 }}>
          Confirm Reset
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
          Restart Pipeline?
        </div>
        <div style={{ fontSize: 13, color: '#444', marginBottom: 24, lineHeight: 1.6 }}>
          This will permanently clear all progress across all 10 screens — study data, annotations, approvals, and algorithm results. You will be returned to Screen 1.
        </div>
        <div style={{
          padding: '12px 14px',
          background: '#fef2f2',
          border: '1px solid #dc2626',
          color: '#7f1d1d',
          fontSize: 12,
          marginBottom: 24,
        }}>
          ⚠ This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 0',
              background: '#dc2626',
              color: '#fff',
              border: '1.5px solid #dc2626',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.03em',
            }}
          >
            Yes, Reset Everything
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 0',
              background: '#fff',
              color: '#000',
              border: '1.5px solid #000',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default function WorkflowNav() {
  const { currentScreen, completedScreens, canAccessScreen, setCurrentScreen, resetPipeline } = useWorkflow();
  const [showModal, setShowModal] = useState(false);

  const handleReset = () => {
    resetPipeline();
    setShowModal(false);
  };

  return (
    <>
      <nav className="workflow-nav">
        <div className="nav-brand">
          <div className="nav-brand-name">TCS-MEDX</div>
          <div className="nav-brand-sub">Clinical Imaging Platform</div>
        </div>

        <ul className="nav-steps">
          {STEPS.map(({ n, label }) => {
            const done = completedScreens.includes(n);
            const active = currentScreen === n;
            const locked = !canAccessScreen(n);
            const cls = `nav-step ${active ? 'active' : done ? 'done' : locked ? 'locked' : ''}`;

            return (
              <li
                key={n}
                className={cls}
                onClick={() => { if (done || active) setCurrentScreen(n); }}
              >
                <div className="nav-step-num">{done ? '✓' : n}</div>
                <span className="nav-step-label">{label}</span>
                {locked && <span className="nav-step-status" title="Complete previous step">🔒</span>}
                {active && !done && <span className="nav-step-status">▶</span>}
              </li>
            );
          })}
        </ul>

        <div className="nav-footer">
          <div style={{ marginBottom: 10 }}>
            Step {currentScreen} of {STEPS.length}<br />
            <span style={{ color: '#555' }}>{completedScreens.length} completed</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'transparent',
              color: '#888',
              border: '1px solid #333',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#dc2626';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#dc2626';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#888';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#333';
            }}
          >
            ↺ Restart Pipeline
          </button>
        </div>
      </nav>

      {showModal && <ResetModal onConfirm={handleReset} onCancel={() => setShowModal(false)} />}
    </>
  );
}
