import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

function ShareableLinkModal({ studyName, onClose }: { studyName: string; onClose: () => void }) {
  const handleDownload = () => {
    const content = JSON.stringify({
      type: 'TCS-MEDX IDP Share Link',
      study: studyName,
      generatedAt: new Date().toISOString(),
      url: `https://tcs-medx.roche.internal/idp/share/${btoa(studyName).slice(0, 16)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accessLevel: 'read-only',
    }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `idp-share-link-${studyName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', border: '2px solid #000', padding: '28px 32px',
        zIndex: 1000, width: 440, maxWidth: '90vw', boxShadow: '8px 8px 0 #000',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>Create Shareable Link</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: '#444', marginBottom: 16, lineHeight: 1.6 }}>
          A read-only shareable link to the IDP for <strong>{studyName}</strong> will be generated and downloaded as a JSON file. The link expires in 7 days.
        </div>
        <div style={{ padding: '10px 12px', background: '#f7f7f7', border: '1px solid #ddd', fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 20, wordBreak: 'break-all' }}>
          https://tcs-medx.roche.internal/idp/share/{btoa(studyName).slice(0, 16)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} style={{ flex: 1, padding: '10px 0', background: '#000', color: '#fff', border: '1.5px solid #000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⬇ Download Link File
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#000', border: '1.5px solid #000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

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
  const [showShareModal, setShowShareModal] = useState(false);
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
        {idpProcessed && (
          <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
            🔗 Create Shareable Link
          </button>
        )}
        <button className="btn btn-primary" onClick={() => completeScreen(6)} disabled={!idpProcessed || isDone}>
          {isDone ? '✓ Committed to SageMaker' : 'Commit to SageMaker →'}
        </button>
      </div>

      {showShareModal && (
        <ShareableLinkModal
          studyName={workflowData.study.studyName}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
