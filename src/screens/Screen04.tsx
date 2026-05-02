import React, { useState } from 'react';
import { useWorkflow, TeamMember } from '../context/WorkflowContext';

const DATASET_VERSIONS = ['', 'v1.0 — Initial ingestion (1,247 files)', 'v1.1 — QC corrected (1,243 files)', 'v2.0 — Annotated subset (523 files)'];
const READER_ROLES = ['', 'Senior Radiologist', 'Imaging Scientist', 'Clinical Researcher', 'QA Reviewer', 'Data Scientist'];
const SOPS = ['SOP-IMG-001: DICOM Annotation Standard', 'SOP-CL-042: Cancer Tumor Analysis Protocol', 'SOP-QA-017: Reader Calibration Checklist'];

export default function Screen04() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(4);
  const { teamName, teamMembers, datasetVersion, auditEnabled, teamCreated, hitlApproved } = workflowData;

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');

  const canCreate = teamName.trim() && datasetVersion && teamMembers.length > 0;

  const addMember = () => {
    if (!newName.trim() || !newRole) return;
    updateWorkflowData({ teamMembers: [...teamMembers, { id: Date.now().toString(), name: newName.trim(), role: newRole }] });
    setNewName('');
    setNewRole('');
  };

  const removeMember = (id: string) => {
    updateWorkflowData({ teamMembers: teamMembers.filter((m: TeamMember) => m.id !== id) });
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 4 of 10  ·  IAE CareSphere Dx</div>
        <div className="screen-title">Internal Reading Center & Human-in-the-Loop</div>
        <div className="screen-desc">Assemble the reading team, assign the dataset version, and enable HITL audit workflows.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Reading team created. HITL workflows approved.</div>}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Team Configuration</div>
          <div className="form-group mb-12">
            <label className="form-label">Team Name</label>
            <input className="form-input" value={teamName} onChange={e => updateWorkflowData({ teamName: e.target.value })} disabled={teamCreated} />
          </div>
          <div className="form-group mb-12">
            <label className="form-label">Case Assignment</label>
            <input className="form-input" value="Cancer Tumor Analysis — Oncology Phase II TA Lung" disabled style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Dataset Version</label>
            <select className="form-select" value={datasetVersion} onChange={e => updateWorkflowData({ datasetVersion: e.target.value })} disabled={teamCreated}>
              {DATASET_VERSIONS.map(v => <option key={v} value={v}>{v || '— Select version —'}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Add Readers</div>
          {!teamCreated && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" placeholder="Reader name" value={newName} onChange={e => setNewName(e.target.value)}
                style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addMember()} />
              <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ flex: 1 }}>
                {READER_ROLES.map(r => <option key={r} value={r}>{r || 'Role'}</option>)}
              </select>
              <button className="btn btn-secondary" onClick={addMember} disabled={!newName.trim() || !newRole}>Add</button>
            </div>
          )}
          {teamMembers.length === 0
            ? <div className="text-sm text-muted">No readers added yet.</div>
            : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Role</th>{!teamCreated && <th></th>}</tr></thead>
                <tbody>
                  {teamMembers.map((m: TeamMember) => (
                    <tr key={m.id}>
                      <td className="font-bold">{m.name}</td>
                      <td className="text-muted">{m.role}</td>
                      {!teamCreated && <td><button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => removeMember(m.id)}>Remove</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      <div className="card">
        <div className="card-title">SOPs & Workflow Settings</div>
        <div className="two-col">
          <div>
            <div className="text-sm font-bold mb-8">Auto-Attached SOPs</div>
            <ul className="check-list">
              {SOPS.map(sop => (
                <li key={sop} className="check-item"><div className="check-icon ok">✓</div><span className="text-sm">{sop}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold mb-8">Workflow Controls</div>
            <div className="toggle-row">
              <span className="text-sm">Audit Tracking</span>
              <label className="toggle">
                <input type="checkbox" checked={auditEnabled} onChange={e => updateWorkflowData({ auditEnabled: e.target.checked })} />
                <div className="toggle-slider" />
              </label>
            </div>
            <div className="toggle-row">
              <span className="text-sm">Dual-Reader Consensus Required</span>
              <label className="toggle"><input type="checkbox" defaultChecked /><div className="toggle-slider" /></label>
            </div>
            <div className="toggle-row">
              <span className="text-sm">Blinded Read Mode</span>
              <label className="toggle"><input type="checkbox" /><div className="toggle-slider" /></label>
            </div>
          </div>
        </div>
        {teamCreated && <div className="alert alert-ok mt-12">✓ Team <strong>{teamName}</strong> created with {teamMembers.length} reader(s). Audit: {auditEnabled ? 'enabled' : 'disabled'}.</div>}
        {hitlApproved && <div className="alert alert-ok mt-8">✓ HITL workflows approved. Readers notified.</div>}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => updateWorkflowData({ teamCreated: true })} disabled={!canCreate || teamCreated}>
          {teamCreated ? '✓ Team Created' : 'Create Team'}
        </button>
        <button className="btn btn-secondary" onClick={() => updateWorkflowData({ hitlApproved: true })} disabled={!teamCreated || hitlApproved}>
          {hitlApproved ? '✓ HITL Approved' : 'Approve HITL Workflows'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(4)} disabled={!hitlApproved || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Reader Annotation →'}
        </button>
      </div>
    </div>
  );
}
