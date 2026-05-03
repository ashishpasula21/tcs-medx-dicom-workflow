import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import ProjectsPanel from './ProjectsPanel';

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
  const {
    user, logoutUser, currentScreen, completedScreens, setCurrentScreen,
    resetPipeline, alertsOpen, setAlertsOpen,
    projectsPanelOpen, setProjectsPanelOpen,
    viewingProject, restoreSession,
    workflowData,
  } = useWorkflow();
  const [showReset, setShowReset] = useState(false);

  const alertCount = 10;
  const currentStudy = workflowData.study.studyName;
  const studyOnboarded = completedScreens.includes(1);

  const handleClearViewingProject = () => {
    restoreSession();
  };

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
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={logoutUser}
              title="Sign out"
              style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', cursor: 'pointer', fontSize: 10, padding: '3px 6px', fontFamily: 'inherit', flexShrink: 0 }}
            >
              Sign Out
            </button>
          </div>
        )}

        <div className="nav-brand">
          <div className="nav-brand-name">TCS-MEDX</div>
          <div className="nav-brand-sub">Clinical Imaging Platform</div>
        </div>

        {/* Viewing a previous deployed project banner */}
        {viewingProject && (
          <div style={{ padding: '10px 20px', background: '#1a1a00', borderBottom: '1px solid #333300' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ca8a04', marginBottom: 3 }}>Viewing Project</div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{viewingProject.name}</div>
            <button onClick={handleClearViewingProject} style={{
              fontSize: 10, fontWeight: 700, background: 'transparent', border: '1px solid #555',
              color: '#aaa', cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit',
            }}>← Back to current</button>
          </div>
        )}

        {/* Current project name */}
        {studyOnboarded && !viewingProject && (
          <div style={{ padding: '10px 20px', background: '#111', borderBottom: '1px solid #222' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 3 }}>Active Project</div>
            <div style={{ fontSize: 11, color: '#ddd', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStudy}
            </div>
          </div>
        )}

        <ul className="nav-steps">
          {STEPS.map(({ n, label }) => {
            const done = completedScreens.includes(n);
            const active = currentScreen === n;
            const maxReached = completedScreens.length > 0 ? Math.max(...completedScreens) + 1 : 1;
            const accessible = n <= maxReached;
            const locked = !accessible;
            const cls = `nav-step ${active ? 'active' : done ? 'done' : locked ? 'locked' : ''}`;

            return (
              <li
                key={n}
                className={cls}
                style={{ cursor: accessible ? 'pointer' : 'not-allowed' }}
                onClick={() => { if (accessible && !viewingProject) setCurrentScreen(n); }}
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
          {/* Projects button */}
          <button
            onClick={() => setProjectsPanelOpen(true)}
            style={{
              width: '100%', padding: '8px 0', marginBottom: 8,
              background: 'transparent', color: '#ccc',
              border: '1px solid #444', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            ◫ Projects
          </button>

          {/* Alerts button */}
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            style={{
              width: '100%', padding: '8px 0', marginBottom: 8,
              background: alertsOpen ? '#fff' : 'transparent',
              color: alertsOpen ? '#000' : '#ccc',
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

          <div style={{ marginBottom: 8, fontSize: 11, color: '#777' }}>
            Step {currentScreen} of {STEPS.length} &nbsp;·&nbsp; {completedScreens.length} done
          </div>

          <button
            onClick={() => setShowReset(true)}
            style={{
              width: '100%', padding: '7px 0', background: 'transparent',
              color: '#dc2626', border: '1px solid #dc2626', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#dc2626'; b.style.color = '#fff'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#dc2626'; }}
          >
            ↺ Restart Pipeline
          </button>
        </div>
      </nav>

      {projectsPanelOpen && <ProjectsPanel />}
      {showReset && <ResetModal onConfirm={() => { resetPipeline(); setShowReset(false); }} onCancel={() => setShowReset(false)} />}
    </>
  );
}
