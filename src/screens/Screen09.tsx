import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

const DRIFT_DATA = [12, 11, 14, 13, 15, 12, 11, 10, 13, 14, 12, 11];
const BIAS_DATA = [5, 6, 5, 7, 6, 5, 6, 5, 4, 6, 5, 5];
const PERF_DATA = [91, 91, 92, 91, 93, 92, 91, 92, 91, 93, 92, 91];

function Sparkline({ data, ok }: { data: number[]; ok: boolean }) {
  const max = Math.max(...data);
  return (
    <div className="sparkline">
      {data.map((v, i) => (
        <div
          key={i}
          className={`spark-bar ${ok ? 'ok' : i === data.length - 1 ? 'warn' : ''}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function Screen09() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(9);
  const selectedAlgo = workflowData.selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';

  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'live'>('idle');
  const [deployProgress, setDeployProgress] = useState(0);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | null>(null);
  const [signedOff, setSignedOff] = useState(workflowData.deploymentSignedOff);

  const handleDeploy = () => {
    if (deploymentStatus !== 'idle') return;
    setDeploymentStatus('deploying');
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setDeployProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDeploymentStatus('live');
      }
    }, 250);
  };

  const handleReview = (decision: 'approved' | 'rejected') => {
    setReviewDecision(decision);
  };

  const handleSignOff = () => {
    updateWorkflowData({ deploymentReviewed: true, deploymentSignedOff: true });
    setSignedOff(true);
  };

  const handleProceed = () => {
    completeScreen(9);
  };

  const canSignOff = deploymentStatus === 'live' && reviewDecision === 'approved' && !signedOff;

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 9 of 10</div>
        <div className="screen-title">Deployment Dashboard</div>
        <div className="screen-desc">Deploy the GxP-validated algorithm to the clinical workflow and monitor performance, drift, and bias in real time.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Model deployed and signed off. Proceed to Business Outcomes.
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Deployment Target</div>
          <div className="text-xs text-muted">Algorithm</div>
          <div className="font-bold mt-4 mb-12" style={{ fontSize: 15 }}>{selectedAlgo}</div>
          <div className="text-xs text-muted">Target</div>
          <div className="font-bold mt-4 mb-12">GIP Clinical Workflow — Oncology Radiology Pipeline</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="badge badge-ok">GxP Validated</span>
            <span className="badge badge-neutral">v1.0.0</span>
            <span className="badge badge-neutral">Lung CT</span>
          </div>

          {deploymentStatus === 'idle' && (
            <button className="btn btn-primary w-full" onClick={handleDeploy}>▶ Deploy to Clinical Workflow</button>
          )}

          {deploymentStatus === 'deploying' && (
            <div>
              <div className="progress-bar" style={{ height: 10, marginBottom: 4 }}>
                <div className="progress-fill" style={{ width: `${deployProgress}%` }} />
              </div>
              <div className="text-xs text-muted">Deploying… {deployProgress}%</div>
            </div>
          )}

          {deploymentStatus === 'live' && (
            <div className="alert alert-ok">
              ✓ Model live in GIP clinical workflow. Endpoint active. Monitoring enabled.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Deployment Status</div>
          <ul className="check-list">
            <li className="check-item">
              <div className={`check-icon ${deploymentStatus !== 'idle' ? 'ok' : 'pending'}`}>
                {deploymentStatus !== 'idle' ? '✓' : '1'}
              </div>
              <span className="text-sm">Container image built & pushed</span>
            </li>
            <li className="check-item">
              <div className={`check-icon ${deploymentStatus === 'live' ? 'ok' : deploymentStatus === 'deploying' ? 'warn' : 'pending'}`}>
                {deploymentStatus === 'live' ? '✓' : deploymentStatus === 'deploying' ? '⟳' : '2'}
              </div>
              <span className="text-sm">Kubernetes rollout complete</span>
            </li>
            <li className="check-item">
              <div className={`check-icon ${deploymentStatus === 'live' ? 'ok' : 'pending'}`}>
                {deploymentStatus === 'live' ? '✓' : '3'}
              </div>
              <span className="text-sm">Health checks passing</span>
            </li>
            <li className="check-item">
              <div className={`check-icon ${deploymentStatus === 'live' ? 'ok' : 'pending'}`}>
                {deploymentStatus === 'live' ? '✓' : '4'}
              </div>
              <span className="text-sm">Monitoring dashboards active</span>
            </li>
            <li className="check-item">
              <div className={`check-icon ${reviewDecision === 'approved' ? 'ok' : reviewDecision === 'rejected' ? 'err' : 'pending'}`}>
                {reviewDecision === 'approved' ? '✓' : reviewDecision === 'rejected' ? '✗' : '5'}
              </div>
              <span className="text-sm">Clinical review completed</span>
            </li>
            <li className="check-item">
              <div className={`check-icon ${signedOff ? 'ok' : 'pending'}`}>{signedOff ? '✓' : '6'}</div>
              <span className="text-sm">Deployment signed off</span>
            </li>
          </ul>
        </div>
      </div>

      {deploymentStatus === 'live' && (
        <div>
          <div className="card">
            <div className="card-title">Real-Time Monitoring</div>
            <div className="monitor-grid">
              <div className="monitor-card">
                <div className="monitor-title">Model Drift</div>
                <Sparkline data={DRIFT_DATA} ok={false} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">KL Divergence</span>
                  <span className="badge badge-ok">Stable</span>
                </div>
                <div className="font-bold mt-4">0.12 <span className="text-xs text-muted">/ threshold 0.25</span></div>
              </div>
              <div className="monitor-card">
                <div className="monitor-title">Prediction Bias</div>
                <Sparkline data={BIAS_DATA} ok={true} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Demographic parity</span>
                  <span className="badge badge-ok">Within bounds</span>
                </div>
                <div className="font-bold mt-4">5.2% <span className="text-xs text-muted">/ max 10%</span></div>
              </div>
              <div className="monitor-card">
                <div className="monitor-title">Performance</div>
                <Sparkline data={PERF_DATA} ok={true} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Accuracy (7d avg)</span>
                  <span className="badge badge-ok">On target</span>
                </div>
                <div className="font-bold mt-4">91.6% <span className="text-xs text-muted">/ min 88%</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Clinical Review Decision</div>
            {reviewDecision === null && (
              <div className="alert alert-info mb-12">Review the deployment monitoring data and approve or reject for clinical use.</div>
            )}
            {reviewDecision === 'approved' && (
              <div className="alert alert-ok mb-12">✓ Deployment approved for clinical use. All monitoring indicators within acceptable range.</div>
            )}
            {reviewDecision === 'rejected' && (
              <div className="alert alert-err mb-12">✗ Deployment rejected. Model requires re-evaluation before clinical rollout.</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-success"
                onClick={() => handleReview('approved')}
                disabled={reviewDecision !== null}
              >
                ✓ Approve Deployment
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReview('rejected')}
                disabled={reviewDecision !== null}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleSignOff} disabled={!canSignOff}>
          {signedOff ? '✓ Signed Off' : 'Sign Off Deployment'}
        </button>
        <button className="btn btn-primary" onClick={handleProceed} disabled={!signedOff || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to Business Outcomes →'}
        </button>
      </div>
    </div>
  );
}
