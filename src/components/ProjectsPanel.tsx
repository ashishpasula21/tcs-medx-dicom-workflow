import React from 'react';
import { useWorkflow, MOCK_PROJECTS, MockProject } from '../context/WorkflowContext';

export default function ProjectsPanel() {
  const { setProjectsPanelOpen, loadProject, workflowData } = useWorkflow();

  const currentStudyName = workflowData.study.studyName;

  return (
    <>
      <div onClick={() => setProjectsPanelOpen(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 4 }}>Projects</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>All Projects</div>
          </div>
          <button onClick={() => setProjectsPanelOpen(false)} style={{
            background: 'none', border: '1.5px solid #000', width: 32, height: 32,
            cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Current project */}
        {currentStudyName && (
          <div style={{ padding: '12px 24px', background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>Current Session</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{currentStudyName}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>In progress · {workflowData.study.cro || '—'}</div>
          </div>
        )}

        {/* Project list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Section: Deployed */}
          <div style={{ padding: '10px 24px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>
            Deployed
          </div>
          {MOCK_PROJECTS.filter(p => p.status === 'deployed').map(p => (
            <div key={p.id} style={{
              padding: '14px 24px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
                  {p.modality} · {p.cro} · Deployed {p.deployedAt}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', background: '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', fontWeight: 700 }}>
                    ✓ Deployed
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 7px', background: '#f7f7f7', border: '1px solid #ccc', color: '#555' }}>
                    {p.accuracy}% accuracy
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 7px', background: '#f7f7f7', border: '1px solid #ccc', color: '#555' }}>
                    AUC {p.auc}
                  </span>
                </div>
              </div>
              <button
                onClick={() => loadProject(p)}
                style={{
                  padding: '7px 14px', background: '#000', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
                }}>
                View →
              </button>
            </div>
          ))}

          {/* Section: In Progress */}
          <div style={{ padding: '16px 24px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>
            In Progress
          </div>
          {MOCK_PROJECTS.filter(p => p.status === 'in-progress').map(p => (
            <div key={p.id} style={{
              padding: '14px 24px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
                  {p.modality} · {p.cro} · Started {p.createdAt}
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', background: '#fefce8', border: '1px solid #ca8a04', color: '#92400e', fontWeight: 700 }}>
                  ⟳ In Progress
                </span>
              </div>
              <button
                onClick={() => loadProject(p)}
                style={{
                  padding: '7px 14px', background: 'transparent', color: '#000', border: '1.5px solid #000',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
                }}>
                Resume →
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', fontSize: 11, color: '#888' }}>
          {MOCK_PROJECTS.length} projects · {MOCK_PROJECTS.filter(p => p.status === 'deployed').length} deployed
        </div>
      </div>
    </>
  );
}
