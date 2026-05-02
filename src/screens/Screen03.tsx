import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const AI_FLAGS = [
  {
    id: 'meta',
    label: 'Missing metadata fields',
    severity: 'warn',
    summary: '3 series missing ProtocolName, 1 missing BodyPartExamined',
    details: [
      { field: 'Affected Series', value: 'S01, S02, S03 (ProtocolName) · S04 (BodyPartExamined)' },
      { field: 'Impact', value: 'Required for FAIR compliance mapping and algorithm input validation' },
      { field: 'Recommended Action', value: 'Request corrected DICOM headers from CRO or manually assign values using study protocol' },
      { field: 'DICOM Tags', value: '(0018,1030) ProtocolName · (0018,0015) BodyPartExamined' },
    ],
  },
  {
    id: 'proto',
    label: 'Protocol deviation detected',
    severity: 'warn',
    summary: 'Slice thickness 3.0mm vs expected 1.5mm in 2 series',
    details: [
      { field: 'Affected Series', value: 'S05 and S08' },
      { field: 'Expected Value', value: '1.5mm slice thickness per TA Lung Protocol v2.3' },
      { field: 'Observed Value', value: '3.0mm (2× deviation)' },
      { field: 'Impact', value: 'May reduce nodule detection sensitivity in thin-slice algorithms. Risk: Medium.' },
      { field: 'Recommended Action', value: 'Flag for clinical review. Consider excluding affected series or annotating as protocol-deviant.' },
      { field: 'DICOM Tag', value: '(0050,0010) SliceThickness' },
    ],
  },
  {
    id: 'corrupt',
    label: 'Image corruption detected (1 file)',
    severity: 'err',
    summary: 'File IM-0023-0041.dcm CRC mismatch — flagged for re-upload',
    details: [
      { field: 'File', value: 'IM-0023-0041.dcm at /data/study-0023/series-237/' },
      { field: 'Error Type', value: 'CRC checksum mismatch — expected 0xA3F2C8D1, got 0x8E41B7A0' },
      { field: 'Series', value: 'Series 237 · Instance 41 of 237 · CT Abdomen Pelvis' },
      { field: 'Impact', value: 'File cannot be read by DICOM parser. Excluded from current dataset (1,243 valid files).' },
      { field: 'Recommended Action', value: 'Request re-transmission of corrupted file from BioCore Imaging GmbH. Do not approve until resolved.' },
    ],
  },
];

const FAIR = [
  { letter: 'F', word: 'Findable',       detail: 'All datasets indexed with persistent identifiers' },
  { letter: 'A', word: 'Accessible',     detail: 'Retrieval via authenticated WADO-RS endpoints' },
  { letter: 'I', word: 'Interoperable',  detail: 'DICOM standard; SNOMED-CT terminology mapped' },
  { letter: 'R', word: 'Reusable',       detail: 'Data use license, provenance & quality metadata attached' },
];

export default function Screen03() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(3);
  const { qcReviewed, qcApproved, qcResolvedFlags, qcScore } = workflowData;
  const [sentBack, setSentBack] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);

  const improvedScore = Math.min(qcScore + qcResolvedFlags.length * 7, 96);

  const toggleFlag = (id: string) => {
    const next = qcResolvedFlags.includes(id)
      ? qcResolvedFlags.filter(f => f !== id)
      : [...qcResolvedFlags, id];
    updateWorkflowData({ qcResolvedFlags: next });
  };

  const toggleExpand = (id: string) => {
    setExpandedFlags(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 3 of 10  ·  IAE CareSphere Dx</div>
        <div className="screen-title">QC & FAIR Dashboard</div>
        <div className="screen-desc">Review dataset quality score, resolve AI-flagged issues, and verify FAIR compliance indicators.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Dataset QC approved. FAIR indicators verified.</div>}

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
                {improvedScore >= 90 ? 'Excellent — Approve for annotation' : improvedScore >= 70 ? 'Acceptable — Minor issues flagged' : 'Below threshold — Review required'}
              </div>
            </div>
          </div>
          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
            {[['1,247', 'Total Files'], ['1,243', 'Valid'], ['4', 'Flagged']].map(([v, l], i) => (
              <div key={l} className="metric-card" style={{ padding: 12 }}>
                <div className="metric-value" style={{ fontSize: 20, color: i === 2 ? 'var(--err)' : i === 1 ? 'var(--ok)' : undefined }}>{v}</div>
                <div className="metric-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">FAIR Indicators</div>
          <div className="fair-grid">
            {FAIR.map(f => (
              <div key={f.letter} className={`fair-cell ${qcReviewed ? 'active' : ''}`} title={f.detail}>
                <div className="fair-letter">{f.letter}</div>
                <div className="fair-word">{f.word}</div>
                <div className="fair-check">{qcReviewed ? '✓' : '?'}</div>
              </div>
            ))}
          </div>
          {qcReviewed && <div className="text-xs text-muted mt-8">All FAIR criteria satisfied per compliance standard v3.2</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title">AI Flagging — {AI_FLAGS.length} Issues Detected</div>
        {!qcReviewed && <div className="alert alert-info mb-12">Click "Review QC Findings" to show flagged issues.</div>}
        {qcReviewed && AI_FLAGS.map(flag => {
          const resolved = qcResolvedFlags.includes(flag.id);
          const expanded = expandedFlags.includes(flag.id);
          return (
            <div key={flag.id}
              onClick={() => toggleFlag(flag.id)}
              style={{
                border: `1px solid ${resolved ? 'var(--ok)' : flag.severity === 'err' ? 'var(--err)' : 'var(--border-light)'}`,
                background: resolved ? 'var(--ok-bg)' : '#fff',
                marginBottom: 8, cursor: 'pointer',
              }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                {/* Resolve checkbox */}
                <div
                  className={`checkbox-box ${resolved ? 'checked' : ''}`}
                  style={{ flexShrink: 0 }}
                  title={resolved ? 'Mark unresolved' : 'Mark resolved'}
                >
                  {resolved ? '✓' : ''}
                </div>

                {/* Title + badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="font-bold" style={{ fontSize: 13 }}>{flag.label}</span>
                    <span className={`badge ${flag.severity === 'err' ? 'badge-err' : 'badge-warn'}`}>
                      {flag.severity === 'err' ? 'Error' : 'Warning'}
                    </span>
                    {resolved && <span className="badge badge-ok">Resolved</span>}
                  </div>
                  <div className="text-xs text-muted mt-4">{flag.summary}</div>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={e => { e.stopPropagation(); toggleExpand(flag.id); }}
                  style={{
                    background: 'none', border: '1px solid var(--border-light)',
                    cursor: 'pointer', padding: '4px 10px', fontSize: 11,
                    fontFamily: 'inherit', fontWeight: 700, color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  }}
                >
                  {expanded ? 'Hide ▲' : 'Details ▼'}
                </button>
              </div>

              {/* Expanded detail table */}
              {expanded && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 14px', background: '#fafafa' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {flag.details.map(d => (
                        <tr key={d.field} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 12px 6px 0', fontWeight: 700, color: '#555', width: 160, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {d.field}
                          </td>
                          <td style={{ padding: '6px 0', color: '#222', lineHeight: 1.5 }}>{d.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {qcReviewed && qcResolvedFlags.length === AI_FLAGS.length && (
          <div className="alert alert-ok mt-8">✓ All flagged issues acknowledged. Quality score updated to {improvedScore}%.</div>
        )}
      </div>

      {sentBack && <div className="alert alert-warn">⚠ Dataset sent back to CRO for remediation.</div>}
      {qcApproved && <div className="alert alert-ok">✓ Dataset approved for reading center assignment.</div>}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => updateWorkflowData({ qcReviewed: true })} disabled={qcReviewed}>
          {qcReviewed ? '✓ QC Reviewed' : 'Review QC Findings'}
        </button>
        <button className="btn btn-danger" onClick={() => setSentBack(true)} disabled={!qcReviewed || qcApproved || sentBack}>
          Send Back to CRO
        </button>
        <button className="btn btn-success" onClick={() => updateWorkflowData({ qcApproved: true })} disabled={!qcReviewed || qcApproved}>
          {qcApproved ? '✓ Approved' : 'Approve Dataset'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(3)} disabled={!qcApproved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Reading Center →'}
        </button>
      </div>
    </div>
  );
}
