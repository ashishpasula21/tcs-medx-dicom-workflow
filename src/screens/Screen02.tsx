import React, { useState, useEffect, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

interface Stage { id: string; label: string; sublabel: string; icon: string; }

const STAGES: Stage[] = [
  { id: 'upload', label: 'CRO Upload', sublabel: 'Receiving data', icon: '⬆' },
  { id: 'deident', label: 'De-identification', sublabel: 'PHI removal', icon: '🔒' },
  { id: 'validate', label: 'Metadata Validation', sublabel: 'Schema check', icon: '✎' },
  { id: 'storage', label: 'Storage', sublabel: 'Object store', icon: '🗄' },
  { id: 'catalog', label: 'Catalog', sublabel: 'FAIR indexing', icon: '📚' },
];

const DELAYS = [1500, 2200, 3100, 3900, 4700];

export default function Screen02() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(2);

  const [stageStatus, setStageStatus] = useState<Record<string, 'pending' | 'active' | 'done'>>({
    upload: 'pending', deident: 'pending', validate: 'pending', storage: 'pending', catalog: 'pending',
  });
  const [slaSeconds, setSlaSeconds] = useState(0);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [approved, setApproved] = useState(workflowData.ingestionApproved);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPipeline = () => {
    if (started) return;
    setStarted(true);

    timerRef.current = setInterval(() => setSlaSeconds(s => s + 1), 1000);

    STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setStageStatus(prev => ({ ...prev, [stage.id]: 'active' }));
        setTimeout(() => {
          setStageStatus(prev => ({ ...prev, [stage.id]: 'done' }));
          if (i === STAGES.length - 1) {
            setPipelineComplete(true);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }, 700);
      }, DELAYS[i]);
    });
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleApprove = () => {
    updateWorkflowData({ ingestionApproved: true });
    setApproved(true);
  };

  const handleProceed = () => {
    completeScreen(2);
  };

  const completedCount = STAGES.filter(s => stageStatus[s.id] === 'done').length;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 2 of 10</div>
        <div className="screen-title">Near Real-Time Ingestion Pipeline</div>
        <div className="screen-desc">Monitor data flow from CRO through de-identification, validation, storage and cataloguing.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Ingestion pipeline approved. Proceed to QC & FAIR Dashboard.
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-12">
          <div className="card-title" style={{ margin: 0 }}>Pipeline Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div className="text-xs text-muted">SLA Timer</div>
              <div className="sla-timer">{String(Math.floor(slaSeconds / 60)).padStart(2,'0')}:{String(slaSeconds % 60).padStart(2,'0')}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Stages</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{completedCount}/{STAGES.length}</div>
            </div>
          </div>
        </div>

        <div className="pipeline">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <div className="pipeline-stage">
                <div className={`pipeline-node ${stageStatus[stage.id]}`}>
                  <div style={{ fontSize: 20 }}>{stage.icon}</div>
                  <div>{stage.label.split(' ')[0]}</div>
                </div>
                <div className="pipeline-label">{stage.label}<br /><span className="text-muted">{stage.sublabel}</span></div>
              </div>
              {i < STAGES.length - 1 && <div className="pipeline-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ margin: '16px 0 8px' }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(completedCount / STAGES.length) * 100}%` }} />
          </div>
          <div className="text-xs text-muted mt-4">{Math.round((completedCount / STAGES.length) * 100)}% complete</div>
        </div>

        {!started && (
          <div className="alert alert-info mt-12">Pipeline is idle. Click "Start Pipeline" to initiate data ingestion from CRO.</div>
        )}

        {pipelineComplete && !approved && (
          <div className="alert alert-ok mt-12">
            ✓ All 5 pipeline stages completed in {slaSeconds}s — within SLA threshold (≤120s).
          </div>
        )}

        {approved && (
          <div className="alert alert-ok mt-12">✓ Pipeline approved by operator. Data is indexed and ready for QC review.</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Stage Details</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Stage</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((stage, i) => (
              <tr key={stage.id}>
                <td className="text-muted">{i + 1}</td>
                <td className="font-bold">{stage.label}</td>
                <td className="text-muted">{stage.sublabel}</td>
                <td>
                  {stageStatus[stage.id] === 'done' && <span className="badge badge-ok">✓ Done</span>}
                  {stageStatus[stage.id] === 'active' && <span className="badge badge-warn">⟳ Running</span>}
                  {stageStatus[stage.id] === 'pending' && <span className="badge badge-neutral">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={startPipeline} disabled={started}>
          {started ? '⟳ Pipeline Running…' : '▶ Start Pipeline'}
        </button>
        <button className="btn btn-secondary" onClick={handleApprove} disabled={!pipelineComplete || approved}>
          {approved ? '✓ Approved' : 'Approve Next Steps'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!approved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to QC & FAIR →'}
        </button>
      </div>
    </div>
  );
}
