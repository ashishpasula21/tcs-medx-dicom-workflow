import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const DATA_SOURCES = [
  { id: 'imaging',   icon: '🖼', label: 'Imaging Data',    detail: '1,243 DICOM files · CT · Annotated' },
  { id: 'clinical',  icon: '📋', label: 'Clinical Data',   detail: 'Patient demographics, Lab results' },
  { id: 'biomarker', icon: '🧬', label: 'Biomarker Data',  detail: 'Genomic markers, Protein panels' },
];

const LINEAGE_STEPS = ['Source', 'QC', 'Annotation', 'IDP'];

export default function Screen06() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(6);
  const { idpLinkedSources, idpProcessed } = workflowData;

  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(idpProcessed ? LINEAGE_STEPS.length : -1);
  const [progress, setProgress] = useState(idpProcessed ? 100 : 0);

  const toggleLink = (id: string) => {
    if (idpProcessed) return;
    const next = idpLinkedSources.includes(id)
      ? idpLinkedSources.filter((l: string) => l !== id)
      : [...idpLinkedSources, id];
    updateWorkflowData({ idpLinkedSources: next });
  };

  const handleProcess = () => {
    if (idpLinkedSources.length < 2 || processing || idpProcessed) return;
    setProcessing(true);
    setProgress(0);
    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      setProgress(Math.min((step / LINEAGE_STEPS.length) * 100, 100));
      if (step >= LINEAGE_STEPS.length) {
        clearInterval(interval);
        setProcessing(false);
        updateWorkflowData({ idpProcessed: true });
      }
    }, 900);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 6 of 10</div>
        <div className="screen-title">Integrated Data Package (IDP) Creation</div>
        <div className="screen-desc">Link imaging, clinical, and biomarker data sources. Process lineage from source to IDP.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ IDP created and lineage recorded.</div>}

      <div className="card">
        <div className="card-title">Data Sources — Select to Link</div>
        <div className="three-col">
          {DATA_SOURCES.map(src => (
            <div key={src.id} onClick={() => toggleLink(src.id)} style={{
              border: `2px solid ${idpLinkedSources.includes(src.id) ? '#000' : 'var(--border-light)'}`,
              padding: 20, cursor: idpProcessed ? 'default' : 'pointer',
              background: idpLinkedSources.includes(src.id) ? '#f0f0f0' : '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, textAlign: 'center', transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 36 }}>{src.icon}</div>
              <div className="font-bold" style={{ fontSize: 13 }}>{src.label}</div>
              <div className="text-xs text-muted">{src.detail}</div>
              {idpLinkedSources.includes(src.id) && <div className="badge badge-ok" style={{ marginTop: 4 }}>✓ Linked</div>}
            </div>
          ))}
        </div>
        {idpLinkedSources.length < 2 && !idpProcessed && (
          <div className="alert alert-info mt-12">Select at least 2 data sources to create an IDP.</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">IDP Lineage Workflow</div>
        <div className="lineage-flow">
          {LINEAGE_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`lineage-node ${currentStep >= i ? 'active' : ''}`}>
                <div className="lineage-node-icon">{['📥', '✅', '✏️', '📦'][i]}</div>
                <div className="lineage-node-label">{step}</div>
                {currentStep >= i && <div style={{ fontSize: 11, marginTop: 2 }}>✓ Done</div>}
              </div>
              {i < LINEAGE_STEPS.length - 1 && <div className="lineage-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
        {processing && (
          <div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted mt-4">Processing: {LINEAGE_STEPS[currentStep]} ({Math.round(progress)}%)</div>
          </div>
        )}
        {idpProcessed && (
          <div className="alert alert-ok mt-12">✓ IDP created. {idpLinkedSources.length} sources linked. Full lineage recorded.</div>
        )}
      </div>

      {idpProcessed && (
        <div className="card">
          <div className="card-title">IDP Summary</div>
          <div className="metric-grid">
            {[[idpLinkedSources.length, 'Sources Linked'], ['1', 'IDP Version'], ['4', 'Lineage Steps'], ['100%', 'Traceability']].map(([v, l]) => (
              <div key={String(l)} className="metric-card"><div className="metric-value">{v}</div><div className="metric-label">{l}</div></div>
            ))}
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleProcess} disabled={idpLinkedSources.length < 2 || processing || idpProcessed}>
          {idpProcessed ? '✓ IDP Created' : processing ? '⟳ Processing…' : 'Process & Create IDP'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(6)} disabled={!idpProcessed || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Algorithm Workbench →'}
        </button>
      </div>
    </div>
  );
}
