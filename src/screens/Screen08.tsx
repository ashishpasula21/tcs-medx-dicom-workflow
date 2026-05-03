import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const APPROVAL_GATES = [
  { id: 'design',     label: 'Design Review',          detail: 'Software architecture and detailed design reviewed against IEC 62304 requirements. No open design defects.' },
  { id: 'vv',         label: 'V&V Completion',          detail: 'All verification and validation activities completed. Test traceability matrix fully covered.' },
  { id: 'risk',       label: 'Risk Acceptability',      detail: 'Residual risks evaluated and accepted per ISO 14971. Risk-benefit analysis documented and approved.' },
  { id: 'regulatory', label: 'Regulatory Review',       detail: 'Regulatory submission package reviewed. Compliance confirmed against applicable standards and regulations.' },
];

const SAMD_DOCS = [
  { id: 'd1',  label: 'Software Development Plan' },
  { id: 'd2',  label: 'Software Requirements Specification (SRS)' },
  { id: 'd3',  label: 'Software Architecture Design' },
  { id: 'd4',  label: 'Software Detailed Design' },
  { id: 'd5',  label: 'SOUP List' },
  { id: 'd6',  label: 'Software Unit Verification' },
  { id: 'd7',  label: 'Software Integration Testing' },
  { id: 'd8',  label: 'Software System Testing' },
  { id: 'd9',  label: 'Software Release Note' },
  { id: 'd10', label: 'Software Risk Management File' },
  { id: 'd11', label: 'Cybersecurity Threat Model and Risk Management' },
  { id: 'd12', label: 'Usability Specification and Risk Analysis' },
  { id: 'd13', label: 'Usability Testing Protocol and Report' },
  { id: 'd14', label: 'Software Configuration Management Plan' },
  { id: 'd15', label: 'Software Problem Resolution Records' },
  { id: 'd16', label: 'Change Impact Assessment Report' },
];

type RiskProb = 'Low' | 'Medium' | 'High';
type RiskImpact = 'Minor' | 'Moderate' | 'Severe';
interface RiskEntry { id: string; description: string; probability: RiskProb; impact: RiskImpact; mitigation: string; }

const SCORE_MAP: Record<string, number> = { Low: 1, Minor: 1, Medium: 2, Moderate: 2, High: 3, Severe: 3 };
function riskScore(p: RiskProb, i: RiskImpact) { return SCORE_MAP[p] * SCORE_MAP[i]; }
function riskLevel(s: number) {
  if (s <= 2) return { label: 'Acceptable', cls: 'badge-ok' };
  if (s <= 4) return { label: 'Review', cls: 'badge-warn' };
  return { label: 'Unacceptable', cls: 'badge-err' };
}

const DEFAULT_RISKS: RiskEntry[] = [
  { id: 'r1', description: 'False-negative nodule detection in low-contrast images', probability: 'Low', impact: 'Severe', mitigation: 'Dual-reader verification for all low-contrast series. Threshold sensitivity tuned to 0.85 recall.' },
  { id: 'r2', description: 'Model drift from distribution shift in new scanner types', probability: 'Medium', impact: 'Moderate', mitigation: 'Continuous monitoring via SageMaker Model Monitor. Alert threshold: KL divergence > 0.25.' },
  { id: 'r3', description: 'PHI leakage via DICOM metadata in model inputs', probability: 'Low', impact: 'Severe', mitigation: 'De-identification enforced at ingestion (Screen 2). Validated against DICOM PS 3.15 Profile E.' },
];

type AlgoTab = 'SaMD' | 'GxP' | 'DHT';

export default function Screen08() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens, viewingProject, setCurrentScreen } = useWorkflow();
  const isDone = completedScreens.includes(8);
  const isDeployedView = !!viewingProject && viewingProject.status === 'deployed';
  const { selectedAlgorithm, checkedGates, managerName, managerTitle, gxpApproved } = workflowData;
  const algo = selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';

  const [riskPanelOpen, setRiskPanelOpen] = useState(false);
  const [risks, setRisks] = useState<RiskEntry[]>(DEFAULT_RISKS);
  const [riskSavedLocal, setRiskSavedLocal] = useState(workflowData.riskSaved);
  const [activeTab, setActiveTab] = useState<AlgoTab>('SaMD');
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);

  const toggleGate = (id: string) => {
    if (gxpApproved) return;
    const next = checkedGates.includes(id) ? checkedGates.filter(g => g !== id) : [...checkedGates, id];
    updateWorkflowData({ checkedGates: next });
  };

  const toggleDoc = (id: string) => {
    setCheckedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const updateRisk = (id: string, field: keyof RiskEntry, value: string) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleExportLogs = () => {
    const logs = {
      project: workflowData.study.studyName,
      exportedAt: new Date().toISOString(),
      pipeline: {
        studyOnboarded: completedScreens.includes(1),
        ingestionApproved: workflowData.ingestionApproved,
        qcApproved: workflowData.qcApproved,
        qcScore: workflowData.qcScore,
        algorithm: workflowData.selectedAlgorithm,
        environment: workflowData.selectedEnvironment,
        checkedGates: workflowData.checkedGates,
        gxpApproved: workflowData.gxpApproved,
        managerSignOff: workflowData.gxpApproved ? `${workflowData.managerName} (${workflowData.managerTitle})` : null,
        checkedDocuments: checkedDocs,
      },
      riskEntries: risks,
      completedScreens,
    };
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gxp-promotion-logs-${workflowData.study.studyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const allGatesApproved = checkedGates.length === APPROVAL_GATES.length;
  const canSignOff = allGatesApproved && managerName.trim() && managerTitle.trim() && !gxpApproved;

  return (
    <div>
      <div className="screen-header" style={{ position: 'relative' }}>
        <button className="btn btn-secondary" onClick={() => setRiskPanelOpen(true)}
          style={{ position: 'absolute', bottom: 16, right: 0 }}>
          ⚠ Risk Register
        </button>
        <div className="screen-tag">Screen 8 of 10</div>
        <div className="screen-title">GxP Promotion Workflow</div>
        <div className="screen-desc">Complete approval gates, check off algorithm documents, and obtain manager sign-off to promote to GxP.</div>
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
              { label: 'Exploratory',     icon: '🔬', done: true },
              { label: 'Under Review',    icon: '🔍', done: true },
              { label: 'Approval Gates',  icon: '✅', done: allGatesApproved },
              { label: 'GxP Validated',   icon: '🏅', done: gxpApproved },
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

      {/* Approval Gates */}
      <div className="card">
        <div className="card-title">Approval Gates</div>
        <div className="text-sm text-muted mb-12">All four gates must be approved before manager sign-off can be completed.</div>
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

      {/* Algorithm Document Checklist */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 0 }}>Algorithm Document Checklist</div>
        <div className="text-sm text-muted" style={{ marginBottom: 14, marginTop: 4 }}>Check off all required documents for the selected algorithm type.</div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 16 }}>
          {(['SaMD', 'GxP', 'DHT'] as AlgoTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 22px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
              background: activeTab === tab ? '#000' : 'transparent',
              color: activeTab === tab ? '#fff' : '#888',
              border: 'none', cursor: 'pointer', letterSpacing: '0.04em',
            }}>{tab}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 12, color: '#888', paddingRight: 4 }}>
            {activeTab === 'SaMD' ? `${checkedDocs.length} / ${SAMD_DOCS.length} checked` : '—'}
          </div>
        </div>

        {activeTab === 'SaMD' && (
          <div>
            {SAMD_DOCS.map(doc => {
              const checked = checkedDocs.includes(doc.id);
              return (
                <div key={doc.id}
                  className={`checkpoint ${checked ? 'checked' : ''}`}
                  onClick={() => toggleDoc(doc.id)}
                  style={{ marginBottom: 4 }}>
                  <div className={`checkbox-box ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold" style={{ fontSize: 13 }}>{doc.label}</div>
                  </div>
                  {checked ? <span className="badge badge-ok">Complete</span> : <span className="badge badge-neutral">Pending</span>}
                </div>
              );
            })}
            {checkedDocs.length === SAMD_DOCS.length && (
              <div className="alert alert-ok mt-12">✓ All {SAMD_DOCS.length} SaMD documents checked off.</div>
            )}
          </div>
        )}

        {(activeTab === 'GxP' || activeTab === 'DHT') && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{activeTab} documents not yet configured</div>
            <div style={{ fontSize: 12 }}>Documents for this algorithm type will appear here once defined.</div>
          </div>
        )}
      </div>

      {/* Risk Register button + Manager Sign-Off */}
      <div className="card">
        <div className="card-title">Manager Sign-Off</div>
        {!allGatesApproved && <div className="alert alert-warn mb-12">Complete all {APPROVAL_GATES.length} approval gates before signing off.</div>}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Manager Name</label>
            <input className="form-input" placeholder="Dr. / Full name" value={managerName}
              onChange={e => updateWorkflowData({ managerName: e.target.value })}
              disabled={!allGatesApproved || gxpApproved} />
          </div>
          <div className="form-group">
            <label className="form-label">Title / Role</label>
            <input className="form-input" placeholder="e.g. VP Clinical Operations" value={managerTitle}
              onChange={e => updateWorkflowData({ managerTitle: e.target.value })}
              disabled={!allGatesApproved || gxpApproved} />
          </div>
        </div>
        {gxpApproved && (
          <div className="alert alert-ok mt-12">✓ GxP promotion approved and signed off by <strong>{managerName}</strong> ({managerTitle}).</div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleExportLogs}>
          ⬇ Export Logs
        </button>
        <button className="btn btn-secondary" onClick={() => updateWorkflowData({ gxpApproved: true })} disabled={!canSignOff}>
          {gxpApproved ? '✓ Signed Off' : 'Approve & Sign Off'}
        </button>
        <button className="btn btn-primary" onClick={() => isDeployedView ? setCurrentScreen(9) : completeScreen(8)} disabled={(!gxpApproved || isDone) && !isDeployedView}>
          {isDone && !isDeployedView ? '✓ Completed' : 'Proceed to Deployment →'}
        </button>
      </div>

      {/* Risk Register side panel */}
      {riskPanelOpen && (
        <>
          <div onClick={() => setRiskPanelOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
            background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 4 }}>Screen 8</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Risk Register</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{workflowData.study.studyName}</div>
              </div>
              <button onClick={() => setRiskPanelOpen(false)} style={{ background: 'none', border: '1.5px solid #000', width: 32, height: 32, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {risks.map((risk, idx) => {
                const score = riskScore(risk.probability, risk.impact);
                const level = riskLevel(score);
                return (
                  <div key={risk.id} style={{ border: '1px solid var(--border-light)', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}>
                      <div className="text-xs font-bold text-muted">Risk {idx + 1}</div>
                      <span className={`badge ${level.cls}`} style={{ marginLeft: 'auto' }}>Score {score} — {level.label}</span>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 8 }}>
                        <label className="form-label">Description</label>
                        <input className="form-input" value={risk.description} onChange={e => updateRisk(risk.id, 'description', e.target.value)} disabled={riskSavedLocal} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div className="form-group">
                          <label className="form-label">Probability</label>
                          <select className="form-select" value={risk.probability} onChange={e => updateRisk(risk.id, 'probability', e.target.value as RiskProb)} disabled={riskSavedLocal}>
                            {(['Low', 'Medium', 'High'] as RiskProb[]).map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Impact</label>
                          <select className="form-select" value={risk.impact} onChange={e => updateRisk(risk.id, 'impact', e.target.value as RiskImpact)} disabled={riskSavedLocal}>
                            {(['Minor', 'Moderate', 'Severe'] as RiskImpact[]).map(i => <option key={i}>{i}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mitigation</label>
                        <input className="form-input" value={risk.mitigation} onChange={e => updateRisk(risk.id, 'mitigation', e.target.value)} disabled={riskSavedLocal} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { setRiskSavedLocal(true); updateWorkflowData({ riskSaved: true }); setRiskPanelOpen(false); }}
                disabled={riskSavedLocal}>
                {riskSavedLocal ? '✓ Saved' : 'Save Risk Register'}
              </button>
              {riskSavedLocal && (
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRiskSavedLocal(false)}>Edit</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
