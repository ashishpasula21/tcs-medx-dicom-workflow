import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const DATA_SOURCES = [
  { id: 'imaging', icon: '🖼', label: 'Imaging Data', detail: '1,243 DICOM files · CT · Annotated', color: '#000' },
  { id: 'clinical', icon: '📋', label: 'Clinical Data', detail: 'Patient demographics, Lab results', color: '#000' },
  { id: 'biomarker', icon: '🧬', label: 'Biomarker Data', detail: 'Genomic markers, Protein panels', color: '#000' },
];

const LINEAGE_STEPS = ['Source', 'QC', 'Annotation', 'IDP'];

export default function Screen06() {
  const { updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(6);

  const [linked, setLinked] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);

  const toggleLink = (id: string) => {
    if (processed) return;
    setLinked(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const handleProcess = () => {
    if (linked.length < 2 || processing || processed) return;
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
        setProcessed(true);
        setProcessing(false);
        updateWorkflowData({ idpProcessed: true });
      }
    }, 900);
  };

  const handleProceed = () => {
    completeScreen(6);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 6 of 10</div>
        <div className="screen-title">Integrated Data Package (IDP) Creation</div>
        <div className="screen-desc">Link imaging, clinical, and biomarker data sources. Process lineage from source to IDP.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ IDP created and lineage recorded. Proceed to Algorithm Workbench.
        </div>
      )}

      <div className="card">
        <div className="card-title">Data Sources — Select to Link</div>
        <div className="three-col">
          {DATA_SOURCES.map(src => (
            <div
              key={src.id}
              onClick={() => toggleLink(src.id)}
              style={{
                border: `2px solid ${linked.includes(src.id) ? '#000' : 'var(--border-light)'}`,
                padding: 20,
                cursor: processed ? 'default' : 'pointer',
                background: linked.includes(src.id) ? '#f0f0f0' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 36 }}>{src.icon}</div>
              <div className="font-bold" style={{ fontSize: 13 }}>{src.label}</div>
              <div className="text-xs text-muted">{src.detail}</div>
              {linked.includes(src.id) && (
                <div className="badge badge-ok" style={{ marginTop: 4 }}>✓ Linked</div>
              )}
            </div>
          ))}
        </div>
        {linked.length < 2 && !processed && (
          <div className="alert alert-info mt-12">Select at least 2 data sources to create an IDP.</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">IDP Lineage Workflow</div>
        <div className="lineage-flow">
          {LINEAGE_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`lineage-node ${currentStep >= i ? 'active' : ''}`}>
                <div className="lineage-node-icon">
                  {['📥', '✅', '✏️', '📦'][i]}
                </div>
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

        {processed && (
          <div className="alert alert-ok mt-12">
            ✓ IDP created successfully. {linked.length} data sources linked. Full lineage recorded from Source → QC → Annotation → IDP.
          </div>
        )}
      </div>

      {processed && (
        <div className="card">
          <div className="card-title">IDP Summary</div>
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-value">{linked.length}</div>
              <div className="metric-label">Sources Linked</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">1</div>
              <div className="metric-label">IDP Version</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">4</div>
              <div className="metric-label">Lineage Steps</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">100%</div>
              <div className="metric-label">Traceability</div>
            </div>
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleProcess} disabled={linked.length < 2 || processing || processed}>
          {processed ? '✓ IDP Created' : processing ? '⟳ Processing…' : 'Process & Create IDP'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!processed || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Algorithm Workbench →'}
        </button>
      </div>
    </div>
  );
}
