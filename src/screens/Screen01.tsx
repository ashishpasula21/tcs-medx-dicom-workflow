import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const MODALITIES = ['', 'Radiology (CT)', 'Radiology (MRI)', 'Radiology (PET)', 'Pathology (WSI)', 'Ultrasound'];
const CROS = ['', 'BioCore Imaging GmbH', 'Covance Imaging', 'ICON Medical Imaging', 'PRA Health Sciences'];
const TEMPLATES = ['', 'DICOM + Study Standards v2.1', 'DICOM + TA Lung Protocol', 'DICOM + Oncology Basic', 'Custom Template'];

export default function Screen01() {
  const { workflowData, updateStudy, completeScreen, completedScreens } = useWorkflow();
  const { study } = workflowData;
  const isDone = completedScreens.includes(1);

  const [studyName, setStudyName] = useState(study.studyName);
  const [modality, setModality] = useState(study.modality);
  const [cro, setCro] = useState(study.cro);
  const [template, setTemplate] = useState(study.metadataTemplate);
  const [studyCreated, setStudyCreated] = useState(study.studyCreated);
  const [ingestionActivated, setIngestionActivated] = useState(study.ingestionActivated);

  const canCreate = studyName.trim() && modality && cro && template;
  const canActivate = studyCreated;
  const canProceed = studyCreated && ingestionActivated;

  const handleCreate = () => {
    if (!canCreate) return;
    updateStudy({ studyName, modality, cro, metadataTemplate: template, studyCreated: true });
    setStudyCreated(true);
  };

  const handleActivate = () => {
    if (!canActivate) return;
    updateStudy({ ingestionActivated: true });
    setIngestionActivated(true);
  };

  const handleProceed = () => {
    if (!canProceed) return;
    completeScreen(1);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 1 of 10</div>
        <div className="screen-title">Study Onboarding Dashboard</div>
        <div className="screen-desc">Create a new imaging study and activate the CRO ingestion pipeline.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Study onboarded and ingestion activated. Proceed to Ingestion Pipeline.
        </div>
      )}

      <div className="card">
        <div className="card-title">Study Configuration</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Study Name</label>
            <input
              className="form-input"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
              disabled={studyCreated}
              placeholder="e.g. Oncology Phase II – TA Lung"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Imaging Modality</label>
            <select
              className="form-select"
              value={modality}
              onChange={e => setModality(e.target.value)}
              disabled={studyCreated}
            >
              {MODALITIES.map(m => <option key={m} value={m}>{m || '— Select modality —'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contract Research Organisation (CRO)</label>
            <select
              className="form-select"
              value={cro}
              onChange={e => setCro(e.target.value)}
              disabled={studyCreated}
            >
              {CROS.map(c => <option key={c} value={c}>{c || '— Select CRO —'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Metadata Template</label>
            <select
              className="form-select"
              value={template}
              onChange={e => setTemplate(e.target.value)}
              disabled={studyCreated}
            >
              {TEMPLATES.map(t => <option key={t} value={t}>{t || '— Select template —'}</option>)}
            </select>
          </div>
        </div>

        {studyCreated && (
          <div className="alert alert-ok mt-16">
            ✓ Study <strong>{studyName}</strong> created successfully. Modality: {modality} · CRO: {cro}
          </div>
        )}

        {studyCreated && (
          <div className="card mt-16" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="card-title">Auto-Attached Metadata Template</div>
            <ul className="check-list">
              <li className="check-item">
                <div className="check-icon ok">✓</div>
                <span>DICOM standard attributes (Patient, Study, Series, Instance)</span>
              </li>
              <li className="check-item">
                <div className="check-icon ok">✓</div>
                <span>Study-specific protocol fields ({modality})</span>
              </li>
              <li className="check-item">
                <div className="check-icon ok">✓</div>
                <span>FAIR metadata requirements — Roche compliance v3.2</span>
              </li>
              <li className="check-item">
                <div className="check-icon ok">✓</div>
                <span>De-identification rules set (PHI removal profile)</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Ingestion Activation</div>
        {!studyCreated ? (
          <div className="alert alert-info">Create the study above before activating ingestion.</div>
        ) : ingestionActivated ? (
          <div className="alert alert-ok">✓ Ingestion pipeline activated. Data flow from {cro} is live.</div>
        ) : (
          <div className="alert alert-warn">⚠ Study created. Click "Activate Ingestion" to begin data flow from CRO.</div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleCreate} disabled={!canCreate || studyCreated}>
          {studyCreated ? '✓ Study Created' : 'Create Study'}
        </button>
        <button className="btn btn-secondary" onClick={handleActivate} disabled={!canActivate || ingestionActivated}>
          {ingestionActivated ? '✓ Ingestion Active' : 'Activate Ingestion'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!canProceed || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Ingestion Pipeline →'}
        </button>
      </div>
    </div>
  );
}
