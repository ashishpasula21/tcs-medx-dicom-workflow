import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

export default function Screen07() {
  const { workflowData, completeScreen, completedScreens, viewingProject, setCurrentScreen } = useWorkflow();
  const isDone = completedScreens.includes(7);
  const isDeployedView2 = !!viewingProject && viewingProject.status === 'deployed';
  const [sageMakerOpened, setSageMakerOpened] = useState(false);

  const project = viewingProject;
  const algo = project?.algorithm || workflowData.selectedAlgorithm || 'ResNet-50 (Lung Nodule Detection)';
  const env = project?.environment || workflowData.selectedEnvironment || 'AWS SageMaker — GPU (ml.p3.8xlarge ×2)';
  const lang = workflowData.selectedLanguage || 'python';
  const isDeployedView = !!project && project.status === 'deployed';

  const handleOpenSageMaker = () => {
    setSageMakerOpened(true);
    window.open('https://studio.sagemaker.aws', '_blank', 'noopener');
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 7 of 10  ·  IAE CareSphere Dx</div>
        <div className="screen-title">Algorithm Development Workbench</div>
        <div className="screen-desc">
          {isDeployedView
            ? `Viewing deployed project: ${project.name}`
            : 'Algorithm committed to AWS SageMaker. Open SageMaker Studio to manage training jobs and experiments.'}
        </div>
      </div>

      {isDone && !isDeployedView && <div className="screen-complete-banner">✓ Committed to SageMaker. Proceed to GxP Promotion.</div>}

      {/* Main committed card */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 40px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>☁</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
          {isDeployedView ? 'Deployed on AWS SageMaker' : 'Committed to AWS SageMaker'}
        </div>
        <div style={{ fontSize: 13, color: '#666', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
          {isDeployedView
            ? `This project is live and serving predictions in the Clinical Information System Workflow.`
            : `Your algorithm and dataset have been committed. Training jobs, experiments, and model registry are managed directly in SageMaker Studio.`}
        </div>

        <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: '1px solid #ddd', marginBottom: 28, textAlign: 'left' }}>
          {[
            ['Algorithm', algo],
            ['Environment', env],
            ...(isDeployedView
              ? [['Accuracy', `${project.accuracy}%`], ['AUC-ROC', String(project.auc)], ['Deployed', project.deployedAt || '—'], ['Annotations', String(project.annotationCount)]]
              : [['Language', lang.toUpperCase()], ['Status', 'Committed']]),
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '10px 16px', background: '#f7f7f7', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenSageMaker}
            style={{
              padding: '12px 28px', background: '#000', color: '#fff',
              border: '2px solid #000', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            ↗ Open in SageMaker Studio
          </button>
          {sageMakerOpened && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              ✓ SageMaker Studio opened
            </div>
          )}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={() => isDeployedView2 ? setCurrentScreen(8) : completeScreen(7)} disabled={isDone && !isDeployedView2}>
          {isDone && !isDeployedView2 ? '✓ Completed' : 'Proceed to GxP Promotion →'}
        </button>
      </div>
    </div>
  );
}
