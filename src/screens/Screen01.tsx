import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const MODALITIES = ['Radiology (CT)', 'Radiology (MRI)', 'Radiology (PET)', 'Pathology (WSI)', 'Ultrasound'];
const CROS = ['BioCore Imaging GmbH', 'Covance Imaging', 'ICON Medical Imaging', 'PRA Health Sciences'];
const TEMPLATES = ['DICOM + Study Standards v2.1', 'DICOM + TA Lung Protocol', 'DICOM + Oncology Basic', 'Custom Template'];
const STUDY_NAMES = ['Oncology Phase II – TA Lung', 'Breast Cancer Screening – Phase III', 'Cardiac MRI Cohort Study', 'Neuro Degenerative Phase I'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function Screen01() {
  const { workflowData, updateStudy, completeScreen, completedScreens } = useWorkflow();
  const { study } = workflowData;
  const isDone = completedScreens.includes(1);

  const handleActivateIngestion = () => {
    // Auto-populate with random selections
    updateStudy({
      studyName: pick(STUDY_NAMES),
      modality: pick(MODALITIES),
      cro: pick(CROS),
      metadataTemplate: pick(TEMPLATES),
      ingestionActivated: true,
    });
  };

  const handleProceed = () => {
    updateStudy({ studyCreated: true });
    completeScreen(1);
  };

  const canProceed = study.ingestionActivated && study.studyName && study.modality && study.cro && study.metadataTemplate;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 1 of 10</div>
        <div className="screen-title">Study Onboarding Dashboard</div>
        <div className="screen-desc">Activate ingestion to auto-configure the study, then review and adjust settings before proceeding.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Study onboarded and ingestion activated. Ingestion pipeline is running.
        </div>
      )}

      {/* Step 1 — Activate Ingestion */}
      {!study.ingestionActivated ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⬆</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Activate CRO Ingestion</div>
          <div className="text-muted" style={{ maxWidth: 400, margin: '0 auto 24px', fontSize: 13, lineHeight: 1.6 }}>
            Click the button below to initiate the ingestion pipeline. Study configurations will be auto-populated from the CRO metadata registry.
          </div>
          <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 14 }} onClick={handleActivateIngestion}>
            Activate Ingestion
          </button>
        </div>
      ) : (
        <>
          <div className="alert alert-ok" style={{ marginBottom: 20 }}>
            ✓ Ingestion activated. Study configuration auto-populated — review and adjust below before confirming.
          </div>

          {/* Study Config — fully editable after activation */}
          <div className="card">
            <div className="card-title">Study Configuration</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Study Name</label>
                <input
                  className="form-input"
                  value={study.studyName}
                  onChange={e => updateStudy({ studyName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Imaging Modality</label>
                <select
                  className="form-select"
                  value={study.modality}
                  onChange={e => updateStudy({ modality: e.target.value })}
                >
                  {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contract Research Organisation (CRO)</label>
                <select
                  className="form-select"
                  value={study.cro}
                  onChange={e => updateStudy({ cro: e.target.value })}
                >
                  {CROS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metadata Template</label>
                <select
                  className="form-select"
                  value={study.metadataTemplate}
                  onChange={e => updateStudy({ metadataTemplate: e.target.value })}
                >
                  {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="card-title">Auto-Attached Metadata Template</div>
            <ul className="check-list">
              <li className="check-item"><div className="check-icon ok">✓</div><span>DICOM standard attributes (Patient, Study, Series, Instance)</span></li>
              <li className="check-item"><div className="check-icon ok">✓</div><span>Study-specific protocol fields ({study.modality})</span></li>
              <li className="check-item"><div className="check-icon ok">✓</div><span>FAIR metadata requirements — Roche compliance v3.2</span></li>
              <li className="check-item"><div className="check-icon ok">✓</div><span>De-identification rules set (PHI removal profile)</span></li>
            </ul>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={handleProceed} disabled={!canProceed}>
              {isDone ? '✓ Completed — Revisiting' : 'Confirm & Proceed to Ingestion →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
