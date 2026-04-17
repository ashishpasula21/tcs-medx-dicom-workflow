import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const AI_FLAGS = [
  { id: 'meta', label: 'Missing metadata fields', severity: 'warn', detail: '3 series missing ProtocolName, 1 missing BodyPartExamined' },
  { id: 'proto', label: 'Protocol deviation detected', severity: 'warn', detail: 'Slice thickness 3.0mm vs expected 1.5mm in 2 series' },
  { id: 'corrupt', label: 'Image corruption (1 file)', severity: 'err', detail: 'File IM-0023-0041.dcm CRC mismatch — flagged for re-upload' },
];

const FAIR = [
  { letter: 'F', word: 'Findable', detail: 'All datasets indexed with persistent identifiers' },
  { letter: 'A', word: 'Accessible', detail: 'Retrieval via authenticated WADO-RS endpoints' },
  { letter: 'I', word: 'Interoperable', detail: 'DICOM standard; SNOMED-CT terminology mapped' },
  { letter: 'R', word: 'Reusable', detail: 'Data use license, provenance & quality metadata attached' },
];

export default function Screen03() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(3);
  const [reviewed, setReviewed] = useState(workflowData.qcReviewed);
  const [approved, setApproved] = useState(workflowData.qcApproved);
  const [sentBack, setSentBack] = useState(false);
  const [resolvedFlags, setResolvedFlags] = useState<string[]>([]);
  const score = workflowData.qcScore;
  const improvedScore = resolvedFlags.length > 0 ? Math.min(score + resolvedFlags.length * 7, 96) : score;

  const toggleFlag = (id: string) => {
    setResolvedFlags(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleReview = () => {
    updateWorkflowData({ qcReviewed: true });
    setReviewed(true);
  };

  const handleApprove = () => {
    updateWorkflowData({ qcApproved: true });
    setApproved(true);
  };

  const handleSendBack = () => {
    setSentBack(true);
  };

  const handleProceed = () => {
    completeScreen(3);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 3 of 10</div>
        <div className="screen-title">QC & FAIR Dashboard</div>
        <div className="screen-desc">Review dataset quality score, resolve AI-flagged issues, and verify FAIR compliance indicators.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Dataset QC approved. FAIR indicators verified. Proceed to Reading Center.
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Dataset Quality Score</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{improvedScore}%</div>
              <div className="text-muted text-sm mt-4">Quality Index</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="progress-bar" style={{ height: 12, marginBottom: 4 }}>
                <div className="progress-fill" style={{ width: `${improvedScore}%` }} />
              </div>
              <div className="text-xs text-muted">
                {improvedScore >= 90 ? 'Excellent — Approve for annotation' :
                  improvedScore >= 70 ? 'Acceptable — Minor issues flagged' :
                  'Below threshold — Review required'}
              </div>
            </div>
          </div>

          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-value" style={{ fontSize: 20 }}>1,247</div>
              <div className="metric-label">Total Files</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-value" style={{ fontSize: 20, color: 'var(--ok)' }}>1,243</div>
              <div className="metric-label">Valid</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-value" style={{ fontSize: 20, color: 'var(--err)' }}>4</div>
              <div className="metric-label">Flagged</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Roche FAIR Indicators</div>
          <div className="fair-grid">
            {FAIR.map(f => (
              <div key={f.letter} className={`fair-cell ${reviewed ? 'active' : ''}`} title={f.detail}>
                <div className="fair-letter">{f.letter}</div>
                <div className="fair-word">{f.word}</div>
                <div className="fair-check">{reviewed ? '✓' : '?'}</div>
              </div>
            ))}
          </div>
          {reviewed && (
            <div className="text-xs text-muted mt-8">All FAIR criteria satisfied per Roche compliance standard v3.2</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">AI Flagging — {AI_FLAGS.length} Issues Detected</div>
        {!reviewed && (
          <div className="alert alert-info mb-12">Click "Review QC Findings" to expand flagged issues.</div>
        )}
        {reviewed && AI_FLAGS.map(flag => (
          <div
            key={flag.id}
            className={`checkpoint ${resolvedFlags.includes(flag.id) ? 'checked' : ''}`}
            onClick={() => toggleFlag(flag.id)}
          >
            <div className={`checkbox-box ${resolvedFlags.includes(flag.id) ? 'checked' : ''}`}>
              {resolvedFlags.includes(flag.id) ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-bold">{flag.label}</span>
                <span className={`badge ${flag.severity === 'err' ? 'badge-err' : 'badge-warn'}`}>
                  {flag.severity === 'err' ? 'Error' : 'Warning'}
                </span>
              </div>
              <div className="text-sm text-muted mt-4">{flag.detail}</div>
            </div>
            <div className="text-sm text-muted">{resolvedFlags.includes(flag.id) ? 'Resolved' : 'Click to resolve'}</div>
          </div>
        ))}
        {reviewed && resolvedFlags.length === AI_FLAGS.length && (
          <div className="alert alert-ok mt-8">✓ All flagged issues acknowledged. Quality score updated to {improvedScore}%.</div>
        )}
      </div>

      {sentBack && (
        <div className="alert alert-warn">
          ⚠ Dataset sent back to CRO for remediation. Awaiting corrected data submission.
        </div>
      )}

      {approved && (
        <div className="alert alert-ok">✓ Dataset approved for reading center assignment.</div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleReview} disabled={reviewed}>
          {reviewed ? '✓ QC Reviewed' : 'Review QC Findings'}
        </button>
        <button className="btn btn-danger" onClick={handleSendBack} disabled={!reviewed || approved || sentBack}>
          Send Back to CRO
        </button>
        <button className="btn btn-success" onClick={handleApprove} disabled={!reviewed || approved}>
          {approved ? '✓ Approved' : 'Approve Dataset'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!approved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Reading Center →'}
        </button>
      </div>
    </div>
  );
}
