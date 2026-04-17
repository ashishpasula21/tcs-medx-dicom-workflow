import React, { useState } from 'react';
import { useWorkflow, AlgorithmResult } from '../context/WorkflowContext';

const ALGORITHMS = [
  '',
  'ResNet-50 (Lung Nodule Detection)',
  'U-Net (Tumor Segmentation)',
  'EfficientNet-B4 (Malignancy Classification)',
  'DenseNet-121 (Multi-label Detection)',
];

const ENVIRONMENTS = ['', 'GPU Cluster — A100 x4 (Azure ML)', 'CPU Batch (On-Premise)', 'Edge Inference (GPU T4)'];

const MOCK_RESULTS: AlgorithmResult[] = [
  { id: '1', name: 'ResNet-50 (Lung Nodule Detection)', accuracy: 91.4, auc: 0.947, risk: 'Low' },
  { id: '2', name: 'U-Net (Tumor Segmentation)', accuracy: 87.2, auc: 0.921, risk: 'Low' },
  { id: '3', name: 'EfficientNet-B4 (Malignancy Classification)', accuracy: 83.7, auc: 0.889, risk: 'Medium' },
  { id: '4', name: 'DenseNet-121 (Multi-label Detection)', accuracy: 78.1, auc: 0.854, risk: 'High' },
];

export default function Screen07() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(7);

  const [environment, setEnvironment] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState(workflowData.selectedAlgorithm);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [results, setResults] = useState<AlgorithmResult[]>(workflowData.algorithmResults);
  const [showResults, setShowResults] = useState(results.length > 0);

  const TRAINING_STEPS = [
    'Initializing environment…', 'Loading IDP dataset…', 'Preprocessing images…',
    'Training — Epoch 1/5…', 'Training — Epoch 3/5…', 'Training — Epoch 5/5…',
    'Running validation…', 'Computing metrics…', 'Generating risk classification…', 'Complete.',
  ];

  const handleRun = () => {
    if (!environment || !selectedAlgo || running) return;
    setRunning(true);
    setProgress(0);
    setShowResults(false);

    TRAINING_STEPS.forEach((label, i) => {
      setTimeout(() => {
        setProgressLabel(label);
        setProgress(Math.round(((i + 1) / TRAINING_STEPS.length) * 100));
        if (i === TRAINING_STEPS.length - 1) {
          setRunning(false);
          const r = MOCK_RESULTS.filter(r => r.name === selectedAlgo || MOCK_RESULTS.indexOf(r) < 2);
          const finalResults = r.length > 0 ? r : MOCK_RESULTS.slice(0, 2);
          setResults(finalResults);
          setShowResults(true);
          updateWorkflowData({ selectedAlgorithm: selectedAlgo, algorithmResults: finalResults, algorithmsRun: true });
        }
      }, i * 500);
    });
  };

  const handleProceed = () => {
    completeScreen(7);
  };

  const riskColor = (risk: string) => {
    if (risk === 'Low') return 'var(--ok)';
    if (risk === 'Medium') return 'var(--warn)';
    return 'var(--err)';
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 7 of 10</div>
        <div className="screen-title">Algorithm Development Workbench</div>
        <div className="screen-desc">Configure the compute environment, select imaging algorithms, run experiments, and review results with risk classification.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Experiments completed. Algorithm selected for GxP promotion. Proceed to GxP Workflow.
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-title">Environment Setup</div>
          <div className="form-group mb-12">
            <label className="form-label">Compute Environment</label>
            <select className="form-select" value={environment} onChange={e => setEnvironment(e.target.value)} disabled={running || showResults}>
              {ENVIRONMENTS.map(e => <option key={e} value={e}>{e || '— Select environment —'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Algorithm</label>
            <select className="form-select" value={selectedAlgo} onChange={e => setSelectedAlgo(e.target.value)} disabled={running || showResults}>
              {ALGORITHMS.map(a => <option key={a} value={a}>{a || '— Select algorithm —'}</option>)}
            </select>
          </div>
          {environment && selectedAlgo && (
            <div className="alert alert-info mt-12">
              <div>Ready to run <strong>{selectedAlgo}</strong> on <strong>{environment}</strong></div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Experiment Configuration</div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Epochs</label>
              <input className="form-input" defaultValue="5" type="number" min="1" max="100" />
            </div>
            <div className="form-group">
              <label className="form-label">Batch Size</label>
              <input className="form-input" defaultValue="32" type="number" />
            </div>
            <div className="form-group">
              <label className="form-label">Learning Rate</label>
              <input className="form-input" defaultValue="0.0001" />
            </div>
            <div className="form-group">
              <label className="form-label">Val Split</label>
              <input className="form-input" defaultValue="0.2" />
            </div>
          </div>
        </div>
      </div>

      {(running || showResults) && (
        <div className="card">
          <div className="card-title">Experiment Run</div>
          <div className="progress-bar" style={{ height: 10, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="text-sm text-muted">{progressLabel}</div>
            <div className="text-sm font-bold">{progress}%</div>
          </div>
        </div>
      )}

      {showResults && (
        <div className="card">
          <div className="card-title">Experiment Results — Risk Classification</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Accuracy</th>
                <th>AUC-ROC</th>
                <th>Risk Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RESULTS.map(result => (
                <tr key={result.id} style={{ background: result.name === selectedAlgo ? 'var(--surface)' : undefined }}>
                  <td>
                    <span className="font-bold">{result.name}</span>
                    {result.name === selectedAlgo && <span className="badge badge-ok" style={{ marginLeft: 8, fontSize: 10 }}>Selected</span>}
                  </td>
                  <td>{result.accuracy}%</td>
                  <td>{result.auc}</td>
                  <td>
                    <span className="font-bold" style={{ color: riskColor(result.risk) }}>{result.risk}</span>
                  </td>
                  <td>
                    <span className={`badge ${result.risk === 'Low' ? 'badge-ok' : result.risk === 'Medium' ? 'badge-warn' : 'badge-err'}`}>
                      {result.risk === 'Low' ? 'GxP Ready' : result.risk === 'Medium' ? 'Review' : 'Not Ready'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="alert alert-ok mt-12">
            ✓ Selected algorithm <strong>{selectedAlgo}</strong> meets GxP-readiness threshold (AUC ≥ 0.90, Risk: Low).
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleRun} disabled={!environment || !selectedAlgo || running || showResults}>
          {running ? `⟳ Running… ${progress}%` : showResults ? '✓ Experiments Done' : '▶ Run Experiments'}
        </button>
        {showResults && (
          <button className="btn btn-secondary" onClick={() => { setShowResults(false); setResults([]); setRunning(false); setProgress(0); }}>
            Reset & Re-run
          </button>
        )}
        <button className="btn btn-primary" onClick={handleProceed} disabled={!showResults || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to GxP Promotion →'}
        </button>
      </div>
    </div>
  );
}
