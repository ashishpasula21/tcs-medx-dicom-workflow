import React, { useState, useEffect, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

interface Stage { id: string; label: string; sublabel: string; icon: string; activeAt: number; doneAt: number; }

// Real-time ms for each stage within the 15-second window
const STAGES: Stage[] = [
  { id: 'upload',   label: 'CRO Upload',           sublabel: 'Receiving data',       icon: '⬆', activeAt: 0,     doneAt: 2500  },
  { id: 'deident',  label: 'De-identification',     sublabel: 'PHI removal',          icon: '🔒', activeAt: 3000,  doneAt: 5500  },
  { id: 'validate', label: 'Metadata Validation',   sublabel: 'Schema check',         icon: '✎',  activeAt: 6000,  doneAt: 8500  },
  { id: 'storage',  label: 'Storage',               sublabel: 'Object store',         icon: '🗄', activeAt: 9000,  doneAt: 11500 },
  { id: 'catalog',  label: 'Catalog',               sublabel: 'FAIR indexing',        icon: '📚', activeAt: 12000, doneAt: 14500 },
];

const TOTAL_REAL_MS = 15000; // 15 real seconds
const TOTAL_SIM_SECONDS = 900; // 15 simulated minutes

export default function Screen02() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(2);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start pipeline on mount
  useEffect(() => {
    if (!workflowData.pipelineStartTime) {
      updateWorkflowData({ pipelineStartTime: Date.now() });
    }
  }, []);

  // Drive the elapsed timer from wall clock
  useEffect(() => {
    const startTime = workflowData.pipelineStartTime;
    if (!startTime) return;

    const update = () => {
      const e = Math.min(Date.now() - startTime, TOTAL_REAL_MS);
      setElapsed(e);
      if (e >= TOTAL_REAL_MS && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    update();
    if (elapsed < TOTAL_REAL_MS) {
      intervalRef.current = setInterval(update, 50);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [workflowData.pipelineStartTime]);

  const getStageStatus = (stage: Stage): 'pending' | 'active' | 'done' => {
    if (elapsed >= stage.doneAt) return 'done';
    if (elapsed >= stage.activeAt) return 'active';
    return 'pending';
  };

  const pipelineComplete = elapsed >= TOTAL_REAL_MS;
  const completedCount = STAGES.filter(s => getStageStatus(s) === 'done').length;

  // Simulated time display: 0 → 15:00
  const simSeconds = Math.round((elapsed / TOTAL_REAL_MS) * TOTAL_SIM_SECONDS);
  const simMins = Math.floor(simSeconds / 60);
  const simSecs = simSeconds % 60;
  const slaDisplay = `${String(simMins).padStart(2, '0')}:${String(simSecs).padStart(2, '0')}`;

  const handleApprove = () => {
    updateWorkflowData({ ingestionApproved: true });
    completeScreen(2);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 2 of 10</div>
        <div className="screen-title">Ingestion Pipeline</div>
        <div className="screen-desc">
          Pipeline auto-started on arrival. Simulates 15-minute ingestion run — watch stages complete in real time.
        </div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Ingestion pipeline approved. Proceed to QC & FAIR Dashboard.
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-12">
          <div className="card-title" style={{ margin: 0 }}>Pipeline Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div className="text-xs text-muted">Simulated SLA</div>
              <div className="sla-timer">{slaDisplay}</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>/ 15:00 target</div>
            </div>
            <div>
              <div className="text-xs text-muted">Stages</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{completedCount}/{STAGES.length}</div>
            </div>
            <div>
              {pipelineComplete
                ? <span className="badge badge-ok" style={{ fontSize: 12 }}>✓ Complete</span>
                : <span className="badge badge-warn" style={{ fontSize: 12 }}>⟳ Running</span>
              }
            </div>
          </div>
        </div>

        <div className="pipeline">
          {STAGES.map((stage, i) => {
            const status = getStageStatus(stage);
            return (
              <React.Fragment key={stage.id}>
                <div className="pipeline-stage">
                  <div className={`pipeline-node ${status}`}>
                    <div style={{ fontSize: 20 }}>{stage.icon}</div>
                    <div>{stage.label}</div>
                  </div>
                  <div className="pipeline-label">
                    {stage.label}<br />
                    <span className="text-muted">{stage.sublabel}</span>
                  </div>
                </div>
                {i < STAGES.length - 1 && <div className="pipeline-arrow">→</div>}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ margin: '16px 0 8px' }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(elapsed / TOTAL_REAL_MS) * 100}%`, transition: 'width 0.1s linear' }} />
          </div>
          <div className="text-xs text-muted mt-4">
            {Math.round((elapsed / TOTAL_REAL_MS) * 100)}% complete
            {!pipelineComplete && <span style={{ marginLeft: 12 }}>— auto-completing in {Math.ceil((TOTAL_REAL_MS - elapsed) / 1000)}s</span>}
          </div>
        </div>

        {pipelineComplete && !workflowData.ingestionApproved && (
          <div className="alert alert-ok mt-12">
            ✓ All 5 pipeline stages completed in 15:00 — within SLA threshold. Click Approve to proceed.
          </div>
        )}
        {workflowData.ingestionApproved && (
          <div className="alert alert-ok mt-12">✓ Pipeline approved. Data is indexed and ready for QC review.</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Stage Details</div>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Stage</th><th>Description</th><th>Sim. Completion</th><th>Status</th></tr>
          </thead>
          <tbody>
            {STAGES.map((stage, i) => {
              const status = getStageStatus(stage);
              const simDoneMin = Math.round((stage.doneAt / TOTAL_REAL_MS) * 15);
              return (
                <tr key={stage.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="font-bold">{stage.label}</td>
                  <td className="text-muted">{stage.sublabel}</td>
                  <td className="text-muted">{simDoneMin}:00</td>
                  <td>
                    {status === 'done' && <span className="badge badge-ok">✓ Done</span>}
                    {status === 'active' && <span className="badge badge-warn">⟳ Running</span>}
                    {status === 'pending' && <span className="badge badge-neutral">Pending</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleApprove} disabled={!pipelineComplete || workflowData.ingestionApproved}>
          {workflowData.ingestionApproved ? '✓ Approved — Proceed to QC & FAIR →' : pipelineComplete ? 'Approve & Proceed to QC & FAIR →' : `⟳ Pipeline running… ${slaDisplay}`}
        </button>
      </div>
    </div>
  );
}
