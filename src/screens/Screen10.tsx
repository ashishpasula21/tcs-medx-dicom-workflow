import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 12, background: 'var(--surface2)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 1s ease' }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, width: 60, textAlign: 'right' }}>{value}</div>
    </div>
  );
}

export default function Screen10() {
  const { workflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(10);
  const [viewed, setViewed] = useState(false);

  const algo = workflowData.selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';
  const lang = workflowData.selectedLanguage || 'python';
  const teamSize = workflowData.teamMembers.length || 3;
  const annotations = workflowData.annotations || 4;
  const complianceGenerated = workflowData.compliancePackageGenerated;
  const riskSaved = workflowData.riskSaved;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 10 of 10</div>
        <div className="screen-title">Business Outcomes Dashboard</div>
        <div className="screen-desc">
          End-to-end summary: CRO ingestion → AI annotation → IDP creation → Risk management →
          GxP promotion → compliance package → live deployment with incident tracking. All governed, traceable, and auditable.
        </div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Full workflow complete. Demo cycle finished successfully.</div>}

      {/* KPI tiles */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--ok)' }}>↑ 4.2×</div>
          <div className="metric-label">Imaging Availability</div>
          <div className="metric-trend trend-up">vs. Legacy Process</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--ok)' }}>↓ 68%</div>
          <div className="metric-label">Validation Effort</div>
          <div className="metric-trend trend-up">Automated GxP gates</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--ok)' }}>↑ 3×</div>
          <div className="metric-label">Algorithm Reuse</div>
          <div className="metric-trend trend-up">SageMaker registry</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--ok)' }}>↑ 55%</div>
          <div className="metric-label">Decision Velocity</div>
          <div className="metric-trend trend-up">Study cycle time</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">100%</div>
          <div className="metric-label">Audit Readiness</div>
          <div className="metric-trend" style={{ color: 'var(--ok)' }}>✓ GxP + CAPA logged</div>
        </div>
      </div>

      <div className="two-col">
        {/* Workflow completion checklist */}
        <div className="card">
          <div className="card-title">Workflow Completion Summary</div>
          <ul className="check-list">
            {[
              `Study "${workflowData.study.studyName}" onboarded`,
              `CRO data ingested via ${workflowData.study.cro || 'BioCore Imaging'}`,
              `QC score: ${workflowData.qcScore}% → 96% (post-remediation)`,
              `${teamSize} readers assigned — HITL workflows active`,
              `${annotations} AI annotations confirmed with measurements signed off`,
              'IDP created (Imaging + Clinical + Biomarker data linked)',
              `Algorithm: ${algo}`,
              `Developed in ${lang.toUpperCase()} via AWS SageMaker`,
              riskSaved ? '3 risks assessed, scored, and mitigated' : 'Risk assessment pending',
              'GxP promotion approved — all 4 gates passed',
              complianceGenerated ? '6 compliance documents AI-generated (SVP, RMF, CFR 11…)' : 'Compliance package pending',
              'Deployed to GIP clinical workflow',
              'Monitoring active: Drift ✓ Bias ✓ Performance ✓',
              'Incident tracking connected (Roche GIP)',
              'CAPA process active — corrective actions logged',
            ].map((item, i) => (
              <li key={i} className="check-item">
                <div className="check-icon ok">✓</div>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {/* Performance benchmarks */}
          <div className="card">
            <div className="card-title">Performance Benchmarks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'CRO → Catalog (SLA)', value: 48, max: 120, unit: 's', note: 'Target ≤120s' },
                { label: 'QC Score',            value: 96, max: 100, unit: '%', note: 'Post-remediation' },
                { label: 'Algorithm Accuracy',  value: 91, max: 100, unit: '%', note: 'ResNet-50' },
                { label: 'AUC-ROC',             value: 95, max: 100, unit: '%', note: '0.947' },
                { label: 'Annotation Coverage', value: 100, max: 100, unit: '%', note: 'AI + reader confirmed' },
                { label: 'Audit Completeness',  value: 100, max: 100, unit: '%', note: 'All steps logged' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-xs text-muted">{item.note}</span>
                  </div>
                  <BarChart value={item.value} max={item.max} color="#000" />
                </div>
              ))}
            </div>
          </div>

          {/* Compliance status */}
          <div className="card">
            <div className="card-title">Compliance & Governance Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                'GxP Validated',
                'FAIR Compliant',
                'Audit Trail',
                'De-identified',
                'DICOM Standard',
                'Traceability',
                'Risk Scored (IEC 62304)',
                complianceGenerated ? 'Compliance Package' : 'Compliance Package — Pending',
                'CAPA Tracked',
                '21 CFR Part 11',
              ].map(item => {
                const ok = !item.includes('Pending');
                return (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    border: `1px solid ${ok ? 'var(--ok)' : 'var(--warn)'}`,
                    background: ok ? 'var(--ok-bg)' : 'var(--warn-bg, #fffbeb)',
                  }}>
                    <span style={{ color: ok ? 'var(--ok)' : 'var(--warn)', fontWeight: 700 }}>{ok ? '✓' : '⟳'}</span>
                    <span className="text-sm">{item.replace(' — Pending', '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* End-to-end lifecycle */}
      <div className="card">
        <div className="card-title">End-to-End Lifecycle Traceability</div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            'CRO Upload', 'De-ID', 'QC/FAIR', 'Reading Center',
            'AI Annotation', 'IDP', 'Algorithm Dev', 'Risk Mgmt',
            'GxP Promotion', 'Deployment', 'CAPA', 'Live',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '6px 10px', background: '#000', color: '#fff',
                fontSize: 11, fontWeight: 700, textAlign: 'center',
              }}>{step}</div>
              {i < arr.length - 1 && <div style={{ color: '#999', padding: '0 2px' }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div className="text-xs text-muted mt-8">All 12 pipeline stages completed and recorded in the immutable audit log.</div>
      </div>

      {/* Technology stack */}
      <div className="card">
        <div className="card-title">Technology Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Algorithm Dev', value: 'AWS SageMaker', note: `${lang.toUpperCase()} / PyTorch` },
            { label: 'Data Platform', value: 'TCS-MEDX', note: 'DICOM + IDP pipeline' },
            { label: 'Compliance', value: 'AI-Generated', note: 'SVP · RMF · CFR 11 · ISO 13485' },
            { label: 'Incident Mgmt', value: 'Roche GIP', note: 'Incident + CAPA integrated' },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 14px', border: '1px solid var(--border-light)', background: 'var(--surface)' }}>
              <div className="text-xs text-muted">{item.label}</div>
              <div className="font-bold mt-4" style={{ fontSize: 14 }}>{item.value}</div>
              <div className="text-xs text-muted mt-4">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => setViewed(true)} disabled={viewed}>
          {viewed ? '✓ Next Steps Reviewed' : 'View Next Steps'}
        </button>
        {viewed && (
          <div className="alert alert-ok" style={{ margin: 0, flex: 1 }}>
            ✓ Full lifecycle demo complete: CRO → FAIR → AI annotation → IDP → Risk mgmt → GxP → Compliance package → Live deployment with CAPA. All governed, traceable, and reusable.
          </div>
        )}
        <button className="btn btn-primary" onClick={() => completeScreen(10)} disabled={!viewed || isDone}>
          {isDone ? '✓ Completed' : 'Complete Demo →'}
        </button>
      </div>
    </div>
  );
}
