import React, { useState } from 'react';
import { useWorkflow, AlgorithmResult } from '../context/WorkflowContext';

const ALGORITHMS = ['', 'ResNet-50 (Lung Nodule Detection)', 'U-Net (Tumor Segmentation)', 'EfficientNet-B4 (Malignancy Classification)', 'DenseNet-121 (Multi-label Detection)'];
const ENVIRONMENTS = [
  '',
  'AWS SageMaker — GPU (ml.p3.8xlarge ×2)',
  'AWS SageMaker — CPU Batch (ml.m5.4xlarge)',
  'Azure ML — GPU Cluster (A100 ×4)',
  'On-Premise — CPU Batch',
];

const INTERPRETERS: Record<string, string[]> = {
  python: ['CPython 3.10 (SageMaker)', 'CPython 3.11', 'PyPy 3.10'],
  r: ['R 4.3.1', 'R 4.2.3 (Bioconductor)', 'Rpy2 3.5 Bridge'],
};

const CODE_SNIPPETS: Record<string, Record<string, string>> = {
  python: {
    'ResNet-50 (Lung Nodule Detection)': `import sagemaker
from sagemaker.pytorch import PyTorch

estimator = PyTorch(
    entry_point='train_resnet50.py',
    role=sagemaker.get_execution_role(),
    instance_type='ml.p3.8xlarge',
    instance_count=2,
    framework_version='2.1',
    py_version='py310',
    hyperparameters={
        'epochs': 5,
        'batch-size': 32,
        'lr': 0.0001,
    }
)

estimator.fit({'training': 's3://roche-idp/lung-ct/'})`,
    'U-Net (Tumor Segmentation)': `import sagemaker
from sagemaker.tensorflow import TensorFlow

estimator = TensorFlow(
    entry_point='train_unet.py',
    role=sagemaker.get_execution_role(),
    instance_type='ml.p3.8xlarge',
    instance_count=2,
    framework_version='2.13',
    py_version='py310',
    hyperparameters={'epochs': 5, 'batch-size': 16}
)
estimator.fit({'training': 's3://roche-idp/tumor-seg/'})`,
    default: `import sagemaker
from sagemaker.pytorch import PyTorch

# Configure estimator for selected algorithm
estimator = PyTorch(
    entry_point='train.py',
    role=sagemaker.get_execution_role(),
    instance_type='ml.p3.8xlarge',
    framework_version='2.1',
    py_version='py310',
    hyperparameters={'epochs': 5, 'batch-size': 32, 'lr': 0.0001},
)
estimator.fit({'training': 's3://roche-idp/dataset/'})`,
  },
  r: {
    default: `library(keras)
library(reticulate)

# Load IDP dataset
dataset <- load_dicom_dataset("s3://roche-idp/lung-ct/")

# Define model
model <- application_resnet50(
  weights = NULL,
  input_shape = c(512L, 512L, 1L),
  classes = 2L
)

model %>% compile(
  optimizer = optimizer_adam(lr = 1e-4),
  loss = "binary_crossentropy",
  metrics = c("accuracy", "AUC")
)

model %>% fit(
  dataset$train, epochs = 5L, batch_size = 32L,
  validation_data = dataset$val
)`,
  },
};

const MOCK_RESULTS: AlgorithmResult[] = [
  { id: '1', name: 'ResNet-50 (Lung Nodule Detection)',            accuracy: 91.4, auc: 0.947, risk: 'Low' },
  { id: '2', name: 'U-Net (Tumor Segmentation)',                   accuracy: 87.2, auc: 0.921, risk: 'Low' },
  { id: '3', name: 'EfficientNet-B4 (Malignancy Classification)',  accuracy: 83.7, auc: 0.889, risk: 'Medium' },
  { id: '4', name: 'DenseNet-121 (Multi-label Detection)',         accuracy: 78.1, auc: 0.854, risk: 'High' },
];

const TRAINING_STEPS = [
  'Initializing SageMaker session…',
  'Uploading IDP dataset to S3…',
  'Provisioning GPU instance (ml.p3.8xlarge)…',
  'Running preprocessing pipeline…',
  'Training — Epoch 1/5…',
  'Training — Epoch 3/5…',
  'Training — Epoch 5/5…',
  'Running validation set…',
  'Computing AUC-ROC metrics…',
  'Generating risk classification…',
  'Complete.',
];

function getCodeSnippet(lang: string, algo: string): string {
  const langSnippets = CODE_SNIPPETS[lang] || CODE_SNIPPETS['python'];
  return langSnippets[algo] || langSnippets['default'] || '';
}

export default function Screen07() {
  const { workflowData, updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(7);
  const { selectedEnvironment, selectedAlgorithm, selectedLanguage, algorithmResults, algorithmsRun } = workflowData;

  // Pre-select a random environment on first load
  React.useEffect(() => {
    if (!selectedEnvironment) {
      const opts = ENVIRONMENTS.filter(e => e !== '');
      updateWorkflowData({ selectedEnvironment: opts[Math.floor(Math.random() * opts.length)] });
    }
  }, []);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(algorithmsRun ? 100 : 0);
  const [progressLabel, setProgressLabel] = useState(algorithmsRun ? 'Complete.' : '');
  const [editingCode, setEditingCode] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [codeExecuted, setCodeExecuted] = useState(false);
  const [selectedInterpreter, setSelectedInterpreter] = useState('');

  const lang = selectedLanguage || 'python';
  const displayCode = codeContent || getCodeSnippet(lang, selectedAlgorithm);
  const interpreters = INTERPRETERS[lang] || INTERPRETERS['python'];

  const riskColor = (r: string) => r === 'Low' ? 'var(--ok)' : r === 'Medium' ? 'var(--warn)' : 'var(--err)';

  const handleLanguageChange = (l: string) => {
    updateWorkflowData({ selectedLanguage: l });
    setCodeContent('');
    setCodeExecuted(false);
    setSelectedInterpreter('');
  };

  const handleRunCode = () => {
    if (!selectedInterpreter) return;
    setCodeExecuted(true);
  };

  const handleRunExperiments = () => {
    if (!selectedEnvironment || !selectedAlgorithm || running) return;
    setRunning(true);
    setProgress(0);
    updateWorkflowData({ algorithmsRun: false, algorithmResults: [] });

    TRAINING_STEPS.forEach((label, i) => {
      setTimeout(() => {
        setProgressLabel(label);
        setProgress(Math.round(((i + 1) / TRAINING_STEPS.length) * 100));
        if (i === TRAINING_STEPS.length - 1) {
          setRunning(false);
          updateWorkflowData({ selectedAlgorithm, algorithmResults: MOCK_RESULTS, algorithmsRun: true });
        }
      }, i * 450);
    });
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 7 of 10</div>
        <div className="screen-title">Algorithm Development Workbench</div>
        <div className="screen-desc">Select compute environment, write algorithm logic, run experiments via AWS SageMaker, and review risk-classified results.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Experiments completed. Algorithm selected for GxP promotion.</div>}

      <div className="two-col">
        {/* Environment + Algorithm setup */}
        <div className="card">
          <div className="card-title">Environment Setup</div>
          <div className="form-group mb-12">
            <label className="form-label">Compute Environment</label>
            <select className="form-select" value={selectedEnvironment}
              onChange={e => updateWorkflowData({ selectedEnvironment: e.target.value })}
              disabled={running || algorithmsRun}>
              {ENVIRONMENTS.map(e => <option key={e} value={e}>{e || '— Select environment —'}</option>)}
            </select>
          </div>
          <div className="form-group mb-12">
            <label className="form-label">Algorithm</label>
            <select className="form-select" value={selectedAlgorithm}
              onChange={e => updateWorkflowData({ selectedAlgorithm: e.target.value })}
              disabled={running || algorithmsRun}>
              {ALGORITHMS.map(a => <option key={a} value={a}>{a || '— Select algorithm —'}</option>)}
            </select>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[['Epochs', '5'], ['Batch Size', '32'], ['Learning Rate', '0.0001'], ['Val Split', '0.2']].map(([l, v]) => (
              <div key={l} className="form-group"><label className="form-label">{l}</label><input className="form-input" defaultValue={v} /></div>
            ))}
          </div>
          {selectedEnvironment && selectedAlgorithm && (
            <div className="alert alert-info mt-12" style={{ fontSize: 12 }}>
              Ready: <strong>{selectedAlgorithm}</strong><br />
              <span className="text-muted">on {selectedEnvironment}</span>
            </div>
          )}
        </div>

        {/* Algorithm Logic Editor */}
        <div className="card">
          <div className="card-title">Algorithm Logic Editor</div>

          {/* Language tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
            {['python', 'r'].map(l => (
              <button key={l} onClick={() => handleLanguageChange(l)} style={{
                padding: '6px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                background: lang === l ? '#000' : 'transparent',
                color: lang === l ? '#fff' : '#888',
                border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{l === 'python' ? 'Python' : 'R'}</button>
            ))}
          </div>

          {/* Interpreter selection */}
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Interpreter</label>
            <select className="form-select" style={{ fontSize: 12 }}
              value={selectedInterpreter}
              onChange={e => { setSelectedInterpreter(e.target.value); setCodeExecuted(false); }}>
              <option value="">— Select interpreter —</option>
              {interpreters.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Code viewer / editor */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            {editingCode ? (
              <textarea
                style={{
                  width: '100%', height: 180, fontFamily: 'monospace', fontSize: 11,
                  background: '#0d1117', color: '#c9d1d9', border: '1px solid #333',
                  padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
                value={codeContent || getCodeSnippet(lang, selectedAlgorithm)}
                onChange={e => setCodeContent(e.target.value)}
              />
            ) : (
              <pre style={{
                background: '#0d1117', color: '#c9d1d9', fontSize: 11, fontFamily: 'monospace',
                padding: '10px 12px', margin: 0, overflow: 'auto', height: 180,
                border: '1px solid #333', lineHeight: 1.5,
              }}>{displayCode}</pre>
            )}
            <button onClick={() => { setEditingCode(!editingCode); if (editingCode) setCodeExecuted(false); }}
              style={{
                position: 'absolute', top: 6, right: 6, fontSize: 10, fontWeight: 700,
                background: '#222', color: '#aaa', border: '1px solid #444',
                padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {editingCode ? 'View' : 'Edit'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12, padding: '6px 0' }}
              onClick={handleRunCode}
              disabled={!selectedInterpreter || codeExecuted}>
              {codeExecuted ? '✓ Executed' : '▶ Run'}
            </button>
            {codeExecuted && (
              <div style={{
                flex: 2, padding: '6px 10px', background: '#0d1117', border: '1px solid #1a7a1a',
                color: '#4ec94e', fontSize: 11, fontFamily: 'monospace',
              }}>
                [OK] Script executed on {selectedInterpreter}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experiment run progress */}
      {(running || algorithmsRun) && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Experiment Run
            <span className="badge badge-neutral" style={{ fontSize: 10 }}>AWS SageMaker</span>
          </div>
          <div className="progress-bar" style={{ height: 10, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="text-sm text-muted">{progressLabel}</div>
            <div className="text-sm font-bold">{progress}%</div>
          </div>
        </div>
      )}

      {/* Results + Risk Classification */}
      {algorithmsRun && (
        <div className="card">
          <div className="card-title">Results — Risk Classification</div>
          <table className="data-table">
            <thead>
              <tr><th>Algorithm</th><th>Accuracy</th><th>AUC-ROC</th><th>Risk</th><th>Status</th></tr>
            </thead>
            <tbody>
              {MOCK_RESULTS.map(r => (
                <tr key={r.id}
                  style={{ cursor: 'pointer', background: r.name === selectedAlgorithm ? 'var(--surface)' : undefined }}
                  onClick={() => updateWorkflowData({ selectedAlgorithm: r.name })}>
                  <td>
                    <span className="font-bold">{r.name}</span>
                    {r.name === selectedAlgorithm && <span className="badge badge-ok" style={{ marginLeft: 8, fontSize: 10 }}>Selected</span>}
                  </td>
                  <td>{r.accuracy}%</td>
                  <td>{r.auc}</td>
                  <td><span className="font-bold" style={{ color: riskColor(r.risk) }}>{r.risk}</span></td>
                  <td><span className={`badge ${r.risk === 'Low' ? 'badge-ok' : r.risk === 'Medium' ? 'badge-warn' : 'badge-err'}`}>
                    {r.risk === 'Low' ? 'GxP Ready' : r.risk === 'Medium' ? 'Review' : 'Not Ready'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="alert alert-ok mt-12">✓ Selected algorithm meets GxP-readiness threshold (AUC ≥ 0.90, Risk: Low).</div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleRunExperiments}
          disabled={!selectedEnvironment || !selectedAlgorithm || running || algorithmsRun}>
          {running ? `⟳ Running… ${progress}%` : algorithmsRun ? '✓ Experiments Done' : '▶ Run Experiments'}
        </button>
        {algorithmsRun && (
          <button className="btn btn-secondary"
            onClick={() => { updateWorkflowData({ algorithmsRun: false, algorithmResults: [] }); setProgress(0); setProgressLabel(''); setCodeExecuted(false); }}>
            Reset & Re-run
          </button>
        )}
        <button className="btn btn-primary" onClick={() => completeScreen(7)} disabled={!algorithmsRun || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to GxP Promotion →'}
        </button>
      </div>
    </div>
  );
}
