import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const DRIFT_DATA  = [12, 11, 14, 13, 15, 12, 11, 10, 13, 14, 12, 11];
const BIAS_DATA   = [5, 6, 5, 7, 6, 5, 6, 5, 4, 6, 5, 5];
const PERF_DATA   = [91, 91, 92, 91, 93, 92, 91, 92, 91, 93, 92, 91];

function Sparkline({ data, ok }: { data: number[]; ok: boolean }) {
  const max = Math.max(...data);
  return (
    <div className="sparkline">
      {data.map((v, i) => (
        <div key={i} className={`spark-bar ${ok ? 'ok' : i === data.length - 1 ? 'warn' : ''}`}
          style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

interface Incident {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  date: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  source: string;
}

interface CapaEntry {
  id: string;
  incidentId: string;
  action: string;
  owner: string;
  due: string;
  completed: boolean;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-001', title: 'Elevated false-negative rate observed in Series 12 (new scanner model)', severity: 'Medium', date: '2026-04-18', status: 'Investigating', source: 'SageMaker Model Monitor' },
  { id: 'INC-002', title: 'Prediction latency spike >2s on 3 consecutive requests', severity: 'Low', date: '2026-04-20', status: 'Resolved', source: 'Roche GIP Monitoring' },
  { id: 'INC-003', title: 'Bias metric exceeded 8% demographic parity gap (elderly cohort)', severity: 'High', date: '2026-04-22', status: 'Open', source: 'Clinical Review' },
];

const MOCK_CAPA: CapaEntry[] = [
  { id: 'CAPA-001', incidentId: 'INC-001', action: 'Re-train model on expanded scanner dataset; update validation set to include new scanner model GE Revolution CT', owner: 'Imaging Scientist', due: '2026-05-10', completed: false },
  { id: 'CAPA-002', incidentId: 'INC-002', action: 'Optimise container resource limits; increase CPU allocation from 2 to 4 cores', owner: 'DevOps Engineer', due: '2026-04-25', completed: true },
  { id: 'CAPA-003', incidentId: 'INC-003', action: 'Perform sub-group fairness analysis; implement stratified sampling for elderly cohort in next training cycle', owner: 'Data Scientist', due: '2026-05-15', completed: false },
];

const sevColor = (s: Incident['severity']) => s === 'High' ? 'badge-err' : s === 'Medium' ? 'badge-warn' : 'badge-neutral';
const statusColor = (s: Incident['status']) => s === 'Resolved' ? 'badge-ok' : s === 'Investigating' ? 'badge-warn' : 'badge-err';

export default function Screen09() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(9);
  const { selectedAlgorithm, deploymentReviewDecision, deploymentSignedOff } = workflowData;
  const algo = selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';

  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'live'>(
    deploymentSignedOff ? 'live' : deploymentReviewDecision ? 'live' : 'idle'
  );
  const [deployProgress, setDeployProgress] = useState(deployStatus === 'live' ? 100 : 0);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [capa, setCapa] = useState<CapaEntry[]>(MOCK_CAPA);
  const [newCapaAction, setNewCapaAction] = useState('');
  const [newCapaOwner, setNewCapaOwner] = useState('');
  const [activeIncident, setActiveIncident] = useState<string | null>(null);

  const handleDeploy = () => {
    if (deployStatus !== 'idle') return;
    setDeployStatus('deploying');
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setDeployProgress(p);
      if (p >= 100) { clearInterval(interval); setDeployStatus('live'); }
    }, 250);
  };

  const handleReview = (decision: 'approved' | 'rejected') => {
    updateWorkflowData({ deploymentReviewDecision: decision });
  };

  const handleSignOff = () => {
    updateWorkflowData({ deploymentSignedOff: true });
  };

  const resolveIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'Resolved' } : inc));
  };

  const toggleCapa = (id: string) => {
    setCapa(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const addCapa = () => {
    if (!newCapaAction.trim() || !activeIncident) return;
    setCapa(prev => [...prev, {
      id: `CAPA-00${prev.length + 1}`,
      incidentId: activeIncident,
      action: newCapaAction,
      owner: newCapaOwner || 'Unassigned',
      due: '2026-05-30',
      completed: false,
    }]);
    setNewCapaAction('');
    setNewCapaOwner('');
  };

  const canSignOff = deployStatus === 'live' && deploymentReviewDecision === 'approved' && !deploymentSignedOff;
  const openIncidents = incidents.filter(i => i.status !== 'Resolved').length;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 9 of 10</div>
        <div className="screen-title">Deployment Dashboard</div>
        <div className="screen-desc">Deploy the GxP-validated algorithm, monitor performance, track incidents, and manage CAPA actions.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Model deployed and signed off. Proceed to Business Outcomes.</div>}

      {/* Deploy + status */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Deployment Target</div>
          <div className="text-xs text-muted">Algorithm</div>
          <div className="font-bold mt-4 mb-12" style={{ fontSize: 15 }}>{algo}</div>
          <div className="text-xs text-muted">Target</div>
          <div className="font-bold mt-4 mb-12">GIP Clinical Workflow — Oncology Radiology Pipeline</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="badge badge-ok">GxP Validated</span>
            <span className="badge badge-neutral">v1.0.0</span>
            <span className="badge badge-neutral">Lung CT</span>
          </div>
          {deployStatus === 'idle' && <button className="btn btn-primary w-full" onClick={handleDeploy}>▶ Deploy to Clinical Workflow</button>}
          {deployStatus === 'deploying' && (
            <div>
              <div className="progress-bar" style={{ height: 10, marginBottom: 4 }}>
                <div className="progress-fill" style={{ width: `${deployProgress}%` }} />
              </div>
              <div className="text-xs text-muted">Deploying… {deployProgress}%</div>
            </div>
          )}
          {deployStatus === 'live' && <div className="alert alert-ok">✓ Model live in GIP clinical workflow. Monitoring enabled.</div>}
        </div>

        <div className="card">
          <div className="card-title">Deployment Status</div>
          <ul className="check-list">
            {[
              { label: 'Container image built & pushed',   done: deployStatus !== 'idle' },
              { label: 'Kubernetes rollout complete',       done: deployStatus === 'live', running: deployStatus === 'deploying' },
              { label: 'Health checks passing',            done: deployStatus === 'live' },
              { label: 'Monitoring dashboards active',     done: deployStatus === 'live' },
              { label: 'Clinical review completed',        done: !!deploymentReviewDecision, err: deploymentReviewDecision === 'rejected' },
              { label: 'Incident tracking connected',      done: deployStatus === 'live' },
              { label: 'Deployment signed off',            done: deploymentSignedOff },
            ].map(({ label, done, running, err }) => (
              <li key={label} className="check-item">
                <div className={`check-icon ${err ? 'err' : done ? 'ok' : running ? 'warn' : 'pending'}`}>
                  {err ? '✗' : done ? '✓' : running ? '⟳' : '·'}
                </div>
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {deployStatus === 'live' && (
        <>
          {/* Real-time monitoring */}
          <div className="card">
            <div className="card-title">Real-Time Monitoring</div>
            <div className="monitor-grid">
              {[
                { title: 'Model Drift', data: DRIFT_DATA, ok: false, label: 'KL Divergence', status: 'Stable', value: '0.12', threshold: '/ threshold 0.25' },
                { title: 'Prediction Bias', data: BIAS_DATA, ok: true, label: 'Demographic parity', status: 'Within bounds', value: '5.2%', threshold: '/ max 10%' },
                { title: 'Performance', data: PERF_DATA, ok: true, label: 'Accuracy (7d avg)', status: 'On target', value: '91.6%', threshold: '/ min 88%' },
              ].map(m => (
                <div key={m.title} className="monitor-card">
                  <div className="monitor-title">{m.title}</div>
                  <Sparkline data={m.data} ok={m.ok} />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-xs text-muted">{m.label}</span>
                    <span className="badge badge-ok">{m.status}</span>
                  </div>
                  <div className="font-bold mt-4">{m.value} <span className="text-xs text-muted">{m.threshold}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Review */}
          <div className="card">
            <div className="card-title">Clinical Review Decision</div>
            {!deploymentReviewDecision && <div className="alert alert-info mb-12">Review monitoring data and approve or reject for clinical use.</div>}
            {deploymentReviewDecision === 'approved' && <div className="alert alert-ok mb-12">✓ Deployment approved for clinical use.</div>}
            {deploymentReviewDecision === 'rejected' && <div className="alert alert-err mb-12">✗ Deployment rejected. Model requires re-evaluation.</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success" onClick={() => handleReview('approved')} disabled={!!deploymentReviewDecision}>✓ Approve</button>
              <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={!!deploymentReviewDecision}>✗ Reject</button>
            </div>
          </div>

          {/* Incident Tracking */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Incident Tracking
              <span className="badge badge-neutral" style={{ fontSize: 10 }}>Roche GIP Integration</span>
              {openIncidents > 0 && (
                <span className="badge badge-err" style={{ marginLeft: 'auto' }}>{openIncidents} Open</span>
              )}
              {openIncidents === 0 && (
                <span className="badge badge-ok" style={{ marginLeft: 'auto' }}>All Resolved</span>
              )}
            </div>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Severity</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id} style={{ cursor: 'pointer', background: activeIncident === inc.id ? 'var(--surface)' : undefined }}
                    onClick={() => setActiveIncident(activeIncident === inc.id ? null : inc.id)}>
                    <td><span className="font-bold" style={{ fontSize: 11 }}>{inc.id}</span></td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: 12 }}>{inc.title}</div>
                      <div className="text-xs text-muted">{inc.source}</div>
                    </td>
                    <td><span className={`badge ${sevColor(inc.severity)}`}>{inc.severity}</span></td>
                    <td className="text-xs text-muted">{inc.date}</td>
                    <td><span className={`badge ${statusColor(inc.status)}`}>{inc.status}</span></td>
                    <td>
                      {inc.status !== 'Resolved' && (
                        <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }}
                          onClick={e => { e.stopPropagation(); resolveIncident(inc.id); }}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CAPA Process */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              CAPA Process
              <span className="badge badge-neutral" style={{ fontSize: 10 }}>Roche GIP Integration</span>
              <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
                {capa.filter(c => c.completed).length}/{capa.length} completed
              </span>
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr><th>CAPA ID</th><th>Incident</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {capa.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-bold" style={{ fontSize: 11 }}>{c.id}</span></td>
                    <td><span className="text-xs text-muted">{c.incidentId}</span></td>
                    <td style={{ maxWidth: 240, fontSize: 12 }}>{c.action}</td>
                    <td className="text-xs">{c.owner}</td>
                    <td className="text-xs text-muted">{c.due}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`checkbox-box ${c.completed ? 'checked' : ''}`} style={{ cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => toggleCapa(c.id)}>
                          {c.completed ? '✓' : ''}
                        </div>
                        <span className={`badge ${c.completed ? 'badge-ok' : 'badge-warn'}`} style={{ fontSize: 10 }}>
                          {c.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Log new CAPA */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
              <div className="text-xs font-bold mb-8" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' }}>Log New CAPA Action</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Action</label>
                  <input className="form-input" placeholder="Describe the corrective action…"
                    value={newCapaAction} onChange={e => setNewCapaAction(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Owner</label>
                  <input className="form-input" placeholder="Name / Role"
                    value={newCapaOwner} onChange={e => setNewCapaOwner(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Incident</label>
                  <select className="form-select" value={activeIncident || ''}
                    onChange={e => setActiveIncident(e.target.value)}>
                    <option value="">— Select —</option>
                    {incidents.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
                  </select>
                </div>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}
                  onClick={addCapa} disabled={!newCapaAction.trim() || !activeIncident}>
                  + Log
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleSignOff} disabled={!canSignOff}>
          {deploymentSignedOff ? '✓ Signed Off' : 'Sign Off Deployment'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(9)} disabled={!deploymentSignedOff || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Business Outcomes →'}
        </button>
      </div>
    </div>
  );
}
