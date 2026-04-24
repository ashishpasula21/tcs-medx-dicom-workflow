import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const APPROVAL_GATES = [
  { id: 'qa',         label: 'QA Review',           detail: 'Validated against QA-ML-001 checklist. No critical findings.' },
  { id: 'testing',    label: 'System Testing',       detail: 'Integration test suite passed (98/100). Benchmarks within spec.' },
  { id: 'validation', label: 'Clinical Validation',  detail: 'Cross-study validation on 3 independent cohorts. Statistically significant.' },
  { id: 'security',   label: 'Security Review',      detail: 'Penetration testing and data access audit passed. No vulnerabilities.' },
];

const COMPLIANCE_DOCS = [
  'Software Validation Plan (SVP) v1.0',
  'Risk Management File (RMF) — IEC 62304',
  '21 CFR Part 11 Audit Trail Report',
  'GDPR Data Processing Agreement',
  'ISO 13485:2016 Compliance Certificate',
  'GxP Validation Summary Report',
];

type RiskProb = 'Low' | 'Medium' | 'High';
type RiskImpact = 'Minor' | 'Moderate' | 'Severe';

interface RiskEntry {
  id: string;
  description: string;
  probability: RiskProb;
  impact: RiskImpact;
  mitigation: string;
}

const SCORE_MAP: Record<RiskProb | RiskImpact, number> = {
  Low: 1, Minor: 1, Medium: 2, Moderate: 2, High: 3, Severe: 3,
};

function riskScore(p: RiskProb, i: RiskImpact): number {
  return SCORE_MAP[p] * SCORE_MAP[i];
}

function riskLevel(score: number): { label: string; cls: string } {
  if (score <= 2) return { label: 'Acceptable', cls: 'badge-ok' };
  if (score <= 4) return { label: 'Review', cls: 'badge-warn' };
  return { label: 'Unacceptable', cls: 'badge-err' };
}

const DEFAULT_RISKS: RiskEntry[] = [
  { id: 'r1', description: 'False-negative nodule detection in low-contrast images', probability: 'Low', impact: 'Severe', mitigation: 'Dual-reader verification for all low-contrast series. Threshold sensitivity tuned to 0.85 recall.' },
  { id: 'r2', description: 'Model drift from distribution shift in new scanner types', probability: 'Medium', impact: 'Moderate', mitigation: 'Continuous monitoring via SageMaker Model Monitor. Alert threshold: KL divergence > 0.25.' },
  { id: 'r3', description: 'PHI leakage via DICOM metadata in model inputs', probability: 'Low', impact: 'Severe', mitigation: 'De-identification enforced at ingestion (Screen 2). Validated against DICOM PS 3.15 Profile E.' },
];

export default function Screen08() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(8);
  const { selectedAlgorithm, checkedGates, managerName, managerTitle, gxpApproved, riskSaved, compliancePackageGenerated } = workflowData;
  const algo = selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';

  const [risks, setRisks] = useState<RiskEntry[]>(DEFAULT_RISKS);
  const [generatingPackage, setGeneratingPackage] = useState(false);

  const toggleGate = (id: string) => {
    if (gxpApproved) return;
    const next = checkedGates.includes(id) ? checkedGates.filter(g => g !== id) : [...checkedGates, id];
    updateWorkflowData({ checkedGates: next });
  };

  const updateRisk = (id: string, field: keyof RiskEntry, value: string) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleGeneratePackage = () => {
    if (generatingPackage || compliancePackageGenerated) return;
    setGeneratingPackage(true);
    setTimeout(() => {
      setGeneratingPackage(false);
      updateWorkflowData({ compliancePackageGenerated: true });
    }, 2000);
  };

  const allGatesApproved = checkedGates.length === APPROVAL_GATES.length;
  const canSignOff = allGatesApproved && riskSaved && managerName.trim() && managerTitle.trim() && !gxpApproved;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 8 of 10</div>
        <div className="screen-title">GxP Promotion Workflow</div>
        <div className="screen-desc">Complete risk assessment, pass all approval gates, generate compliance package, and obtain manager sign-off to promote to GxP.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Algorithm promoted to GxP. Proceed to Deployment.</div>}

      {/* Model overview */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Model Under Review</div>
          <div className="text-xs text-muted">Algorithm</div>
          <div className="font-bold mt-4 mb-12" style={{ fontSize: 15 }}>{algo}</div>
          <hr className="divider" />
          <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="metric-card" style={{ padding: 12 }}><div className="metric-value" style={{ fontSize: 18 }}>91.4%</div><div className="metric-label">Accuracy</div></div>
            <div className="metric-card" style={{ padding: 12 }}><div className="metric-value" style={{ fontSize: 18 }}>0.947</div><div className="metric-label">AUC-ROC</div></div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-neutral">v1.0.0</span>
            {gxpApproved ? <span className="badge badge-ok">GxP Promoted</span> : <span className="badge badge-warn">Exploratory</span>}
            <span className="badge badge-neutral">Lung CT</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Promotion Path</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Exploratory',       icon: '🔬', done: true },
              { label: 'Risk Assessment',   icon: '⚠',  done: riskSaved },
              { label: 'Approval Gates',    icon: '✅',  done: allGatesApproved },
              { label: 'Compliance Package',icon: '📄',  done: compliancePackageGenerated },
              { label: 'GxP Validated',     icon: '🏅',  done: gxpApproved },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                border: `1px solid ${step.done ? 'var(--ok)' : 'var(--border-light)'}`,
                background: step.done ? 'var(--ok-bg)' : 'var(--surface)',
              }}>
                <div style={{ fontSize: 16 }}>{step.icon}</div>
                <div className="font-bold text-sm">{step.label}</div>
                {step.done && <div style={{ marginLeft: 'auto', color: 'var(--ok)', fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Risk Management
          {riskSaved && <span className="badge badge-ok">Saved</span>}
        </div>
        <div className="text-sm text-muted mb-12">Document risks, assign probability and impact, define mitigations. Required before sign-off.</div>

        {risks.map((risk, idx) => {
          const score = riskScore(risk.probability, risk.impact);
          const level = riskLevel(score);
          return (
            <div key={risk.id} style={{ border: '1px solid var(--border-light)', marginBottom: 10, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)' }}>
                <div className="text-xs font-bold text-muted">Risk {idx + 1}</div>
                <span className={`badge ${level.cls}`} style={{ marginLeft: 'auto' }}>Score {score} — {level.label}</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Risk Description</label>
                  <input className="form-input" value={risk.description}
                    onChange={e => updateRisk(risk.id, 'description', e.target.value)}
                    disabled={riskSaved} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Probability</label>
                    <select className="form-select" value={risk.probability}
                      onChange={e => updateRisk(risk.id, 'probability', e.target.value as RiskProb)}
                      disabled={riskSaved}>
                      {(['Low', 'Medium', 'High'] as RiskProb[]).map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Impact</label>
                    <select className="form-select" value={risk.impact}
                      onChange={e => updateRisk(risk.id, 'impact', e.target.value as RiskImpact)}
                      disabled={riskSaved}>
                      {(['Minor', 'Moderate', 'Severe'] as RiskImpact[]).map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mitigation</label>
                  <input className="form-input" value={risk.mitigation}
                    onChange={e => updateRisk(risk.id, 'mitigation', e.target.value)}
                    disabled={riskSaved} />
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ fontSize: 12 }}
            onClick={() => updateWorkflowData({ riskSaved: true })}
            disabled={riskSaved}>
            {riskSaved ? '✓ Risk Assessment Saved' : 'Save Risk Assessment'}
          </button>
          {riskSaved && !gxpApproved && (
            <button className="btn btn-secondary" style={{ fontSize: 12 }}
              onClick={() => updateWorkflowData({ riskSaved: false })}>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Approval Gates */}
      <div className="card">
        <div className="card-title">Approval Gates</div>
        <div className="text-sm text-muted mb-12">All gates must be approved before compliance package generation.</div>
        {APPROVAL_GATES.map(gate => (
          <div key={gate.id} className={`checkpoint ${checkedGates.includes(gate.id) ? 'checked' : ''}`} onClick={() => toggleGate(gate.id)}>
            <div className={`checkbox-box ${checkedGates.includes(gate.id) ? 'checked' : ''}`}>{checkedGates.includes(gate.id) ? '✓' : ''}</div>
            <div style={{ flex: 1 }}>
              <div className="font-bold">{gate.label}</div>
              <div className="text-xs text-muted mt-4">{gate.detail}</div>
            </div>
            {checkedGates.includes(gate.id) ? <span className="badge badge-ok">Approved</span> : <span className="badge badge-neutral">Pending</span>}
          </div>
        ))}
      </div>

      {/* AI Compliance Package Generation */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Compliance Package Generation
          <span className="badge badge-neutral" style={{ fontSize: 10 }}>AI Enabled</span>
        </div>
        {!allGatesApproved && (
          <div className="alert alert-warn mb-12">Complete all approval gates before generating the compliance package.</div>
        )}
        {allGatesApproved && !compliancePackageGenerated && (
          <div className="alert alert-info mb-12">All gates passed. Generate the compliance package to proceed to sign-off.</div>
        )}
        <button className="btn btn-secondary" style={{ marginBottom: 12 }}
          onClick={handleGeneratePackage}
          disabled={!allGatesApproved || generatingPackage || compliancePackageGenerated}>
          {generatingPackage ? '⟳ Generating…' : compliancePackageGenerated ? '✓ Package Generated' : '⬇ Generate Compliance Package (AI)'}
        </button>

        {compliancePackageGenerated && (
          <div>
            <div className="text-xs text-muted mb-8">Generated {COMPLIANCE_DOCS.length} compliance documents:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {COMPLIANCE_DOCS.map(doc => (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--ok)', background: 'var(--ok-bg)' }}>
                  <span style={{ color: 'var(--ok)', fontWeight: 700 }}>✓</span>
                  <span className="text-sm">{doc}</span>
                  <button style={{
                    marginLeft: 'auto', padding: '2px 10px', fontSize: 10, fontWeight: 700,
                    background: 'transparent', border: '1px solid #999', color: '#666',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>⬇ Download</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manager Sign-Off */}
      <div className="card">
        <div className="card-title">Manager Sign-Off</div>
        {!riskSaved && <div className="alert alert-warn mb-12">Complete and save the Risk Assessment first.</div>}
        {!allGatesApproved && riskSaved && <div className="alert alert-warn mb-12">Complete all {APPROVAL_GATES.length} approval gates before signing off.</div>}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Manager Name</label>
            <input className="form-input" placeholder="Dr. / Full name" value={managerName}
              onChange={e => updateWorkflowData({ managerName: e.target.value })}
              disabled={!allGatesApproved || !riskSaved || gxpApproved} />
          </div>
          <div className="form-group">
            <label className="form-label">Title / Role</label>
            <input className="form-input" placeholder="e.g. VP Clinical Operations" value={managerTitle}
              onChange={e => updateWorkflowData({ managerTitle: e.target.value })}
              disabled={!allGatesApproved || !riskSaved || gxpApproved} />
          </div>
        </div>
        {gxpApproved && (
          <div className="alert alert-ok mt-12">✓ GxP promotion approved and signed off by <strong>{managerName}</strong> ({managerTitle}).</div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary"
          onClick={() => updateWorkflowData({ gxpApproved: true })}
          disabled={!canSignOff}>
          {gxpApproved ? '✓ Signed Off' : 'Approve & Sign Off'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(8)} disabled={!gxpApproved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Deployment →'}
        </button>
      </div>
    </div>
  );
}
