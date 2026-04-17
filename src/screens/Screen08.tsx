import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const APPROVAL_GATES = [
  { id: 'qa', label: 'QA Review', detail: 'Validated against QA-ML-001 checklist. Model bias assessment completed. No critical findings.' },
  { id: 'testing', label: 'System Testing', detail: 'Integration test suite passed (98/100). Performance benchmarks within specification.' },
  { id: 'validation', label: 'Clinical Validation', detail: 'Cross-study validation completed on 3 independent cohorts. Statistical significance confirmed.' },
  { id: 'security', label: 'Security Review', detail: 'Penetration testing and data access audit passed. No vulnerabilities identified.' },
];

export default function Screen08() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(8);
  const selectedAlgo = workflowData.selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';

  const [checkedGates, setCheckedGates] = useState<string[]>([]);
  const [managerName, setManagerName] = useState('');
  const [managerTitle, setManagerTitle] = useState('');
  const [signedOff, setSignedOff] = useState(false);
  const [gxpApproved, setGxpApproved] = useState(workflowData.gxpApproved);

  const toggleGate = (id: string) => {
    if (signedOff) return;
    setCheckedGates(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const allGatesApproved = checkedGates.length === APPROVAL_GATES.length;
  const canSignOff = allGatesApproved && managerName.trim() && managerTitle.trim();

  const handleSignOff = () => {
    if (!canSignOff) return;
    updateWorkflowData({ qaApproved: true, testingApproved: true, managerSignOff: managerName, gxpApproved: true });
    setSignedOff(true);
    setGxpApproved(true);
  };

  const handleProceed = () => {
    completeScreen(8);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 8 of 10</div>
        <div className="screen-title">GxP Promotion Workflow</div>
        <div className="screen-desc">Promote the algorithm from Exploratory to GxP-ready status. Complete all approval gates and obtain manager sign-off.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Algorithm promoted to GxP. Proceed to Deployment Dashboard.
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Model Under Review</div>
          <div style={{ padding: '4px 0' }}>
            <div className="text-xs text-muted">Algorithm</div>
            <div className="font-bold mt-4" style={{ fontSize: 15 }}>{selectedAlgo}</div>
          </div>
          <hr className="divider" />
          <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-value" style={{ fontSize: 18 }}>91.4%</div>
              <div className="metric-label">Accuracy</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-value" style={{ fontSize: 18 }}>0.947</div>
              <div className="metric-label">AUC-ROC</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-neutral">v1.0.0</span>
            <span className="badge badge-warn">Exploratory</span>
            <span className="badge badge-neutral">Lung CT</span>
          </div>
          {gxpApproved && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span className="badge badge-ok">GxP Promoted</span>
              <span className="badge badge-ok">Audit Trail Active</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Promotion Path</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Exploratory', icon: '🔬', done: true },
              { label: 'Under Review', icon: '🔍', done: true },
              { label: 'Approval Gates', icon: '✅', done: allGatesApproved },
              { label: 'GxP Validated', icon: '🏅', done: gxpApproved },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                border: `1px solid ${step.done ? 'var(--ok)' : 'var(--border-light)'}`,
                background: step.done ? 'var(--ok-bg)' : 'var(--surface)',
              }}>
                <div style={{ fontSize: 18 }}>{step.icon}</div>
                <div className="font-bold text-sm">{step.label}</div>
                {step.done && <div style={{ marginLeft: 'auto', color: 'var(--ok)', fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Approval Gates</div>
        <div className="text-sm text-muted mb-12">All gates must be approved before manager sign-off can be completed.</div>
        {APPROVAL_GATES.map(gate => (
          <div
            key={gate.id}
            className={`checkpoint ${checkedGates.includes(gate.id) ? 'checked' : ''}`}
            onClick={() => toggleGate(gate.id)}
          >
            <div className={`checkbox-box ${checkedGates.includes(gate.id) ? 'checked' : ''}`}>
              {checkedGates.includes(gate.id) ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-bold">{gate.label}</div>
              <div className="text-xs text-muted mt-4">{gate.detail}</div>
            </div>
            {checkedGates.includes(gate.id)
              ? <span className="badge badge-ok">Approved</span>
              : <span className="badge badge-neutral">Pending</span>
            }
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Manager Sign-Off</div>
        {!allGatesApproved && (
          <div className="alert alert-warn mb-12">Complete all {APPROVAL_GATES.length} approval gates before signing off.</div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Manager Name</label>
            <input
              className="form-input"
              placeholder="Dr. / Full name"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              disabled={!allGatesApproved || signedOff}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Title / Role</label>
            <input
              className="form-input"
              placeholder="e.g. VP Clinical Operations"
              value={managerTitle}
              onChange={e => setManagerTitle(e.target.value)}
              disabled={!allGatesApproved || signedOff}
            />
          </div>
        </div>
        {signedOff && (
          <div className="alert alert-ok mt-12">
            ✓ GxP promotion approved and signed off by <strong>{managerName}</strong> ({managerTitle}). Algorithm status updated to GxP-validated.
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleSignOff} disabled={!canSignOff || signedOff}>
          {signedOff ? '✓ Signed Off' : 'Approve & Sign Off'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!gxpApproved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Deployment →'}
        </button>
      </div>
    </div>
  );
}
