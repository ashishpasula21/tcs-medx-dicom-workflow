import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface WorkflowUser { username: string; role: string; }

export interface StudyData {
  studyName: string;
  modality: string;
  cro: string;
  metadataTemplate: string;
  ingestionActivated: boolean;
  studyCreated: boolean;
}

export interface TeamMember { id: string; name: string; role: string; }

export interface AlgorithmResult {
  id: string; name: string; accuracy: number; auc: number; risk: 'Low' | 'Medium' | 'High';
}

export interface MockProject {
  id: string;
  name: string;
  status: 'deployed' | 'in-progress';
  algorithm: string;
  environment: string;
  accuracy: number;
  auc: number;
  cro: string;
  modality: string;
  deployedAt?: string;
  createdAt: string;
  annotationCount: number;
}

export const MOCK_PROJECTS: MockProject[] = [
  { id: 'p1', name: 'Breast Cancer Screening – Phase III', status: 'deployed', algorithm: 'EfficientNet-B4 (Malignancy Classification)', environment: 'AWS SageMaker — GPU (ml.p3.8xlarge ×2)', accuracy: 89.1, auc: 0.921, cro: 'Covance Imaging', modality: 'Radiology (MRI)', deployedAt: '2026-02-14', createdAt: '2026-01-20', annotationCount: 312 },
  { id: 'p2', name: 'Cardiac MRI Cohort Study', status: 'deployed', algorithm: 'U-Net (Tumor Segmentation)', environment: 'AWS SageMaker — CPU Batch (ml.m5.4xlarge)', accuracy: 86.4, auc: 0.903, cro: 'ICON Medical Imaging', modality: 'Radiology (MRI)', deployedAt: '2026-03-01', createdAt: '2026-02-01', annotationCount: 187 },
  { id: 'p3', name: 'Neuro Degenerative Phase I', status: 'in-progress', algorithm: 'DenseNet-121 (Multi-label Detection)', environment: 'Azure ML — GPU Cluster (A100 ×4)', accuracy: 0, auc: 0, cro: 'PRA Health Sciences', modality: 'Radiology (MRI)', createdAt: '2026-04-10', annotationCount: 0 },
  { id: 'p4', name: 'Prostate Oncology – TA Prostate', status: 'deployed', algorithm: 'ResNet-50 (Lung Nodule Detection)', environment: 'AWS SageMaker — GPU (ml.p3.8xlarge ×2)', accuracy: 92.3, auc: 0.958, cro: 'BioCore Imaging GmbH', modality: 'Radiology (CT)', deployedAt: '2026-03-22', createdAt: '2026-02-28', annotationCount: 428 },
  { id: 'p5', name: 'Liver Lesion Detection – Phase II', status: 'in-progress', algorithm: '', environment: '', accuracy: 0, auc: 0, cro: 'Covance Imaging', modality: 'Radiology (CT)', createdAt: '2026-04-18', annotationCount: 0 },
];

export interface WorkflowData {
  study: StudyData;
  pipelineStartTime: number | null;
  ingestionApproved: boolean;
  qcScore: number;
  qcReviewed: boolean;
  qcApproved: boolean;
  qcResolvedFlags: string[];
  teamName: string;
  teamMembers: TeamMember[];
  datasetVersion: string;
  auditEnabled: boolean;
  teamCreated: boolean;
  hitlApproved: boolean;
  annotations: number;
  annotationSignedOff: boolean;
  idpLinkedSources: string[];
  idpProcessed: boolean;
  selectedEnvironment: string;
  selectedAlgorithm: string;
  selectedLanguage: string;
  algorithmResults: AlgorithmResult[];
  algorithmsRun: boolean;
  checkedGates: string[];
  riskSaved: boolean;
  compliancePackageGenerated: boolean;
  managerName: string;
  managerTitle: string;
  gxpApproved: boolean;
  deploymentStartTime: number | null;
  deploymentReviewDecision: 'approved' | 'rejected' | null;
  deploymentSignedOff: boolean;
}

interface SavedSession {
  workflowData: WorkflowData;
  completedScreens: number[];
  currentScreen: number;
}

interface WorkflowContextType {
  user: WorkflowUser | null;
  loginUser: (username: string) => void;
  logoutUser: () => void;
  alertsOpen: boolean;
  setAlertsOpen: (open: boolean) => void;
  projectsPanelOpen: boolean;
  setProjectsPanelOpen: (open: boolean) => void;
  viewingProject: MockProject | null;
  currentScreen: number;
  completedScreens: number[];
  workflowData: WorkflowData;
  setCurrentScreen: (n: number) => void;
  completeScreen: (n: number) => void;
  updateWorkflowData: (data: Partial<WorkflowData>) => void;
  updateStudy: (data: Partial<StudyData>) => void;
  resetPipeline: () => void;
  loadProject: (p: MockProject) => void;
  restoreSession: () => void;
  hasSavedSession: boolean;
}

const defaultStudy: StudyData = {
  studyName: 'Oncology Phase II – TA Lung',
  modality: '',
  cro: '',
  metadataTemplate: '',
  ingestionActivated: false,
  studyCreated: false,
};

const defaultData: WorkflowData = {
  study: defaultStudy,
  pipelineStartTime: null,
  ingestionApproved: false,
  qcScore: 73,
  qcReviewed: false,
  qcApproved: false,
  qcResolvedFlags: [],
  teamName: 'Cancer Tumor Analysis Team',
  teamMembers: [],
  datasetVersion: '',
  auditEnabled: true,
  teamCreated: false,
  hitlApproved: false,
  annotations: 0,
  annotationSignedOff: false,
  idpLinkedSources: [],
  idpProcessed: false,
  selectedEnvironment: '',
  selectedAlgorithm: '',
  selectedLanguage: '',
  algorithmResults: [],
  algorithmsRun: false,
  checkedGates: [],
  riskSaved: false,
  compliancePackageGenerated: false,
  managerName: '',
  managerTitle: '',
  gxpApproved: false,
  deploymentStartTime: null,
  deploymentReviewDecision: null,
  deploymentSignedOff: false,
};

function projectToWorkflowData(p: MockProject): WorkflowData {
  if (p.status === 'deployed') {
    return {
      study: { studyName: p.name, modality: p.modality, cro: p.cro, metadataTemplate: 'DICOM + Study Standards v2.1', ingestionActivated: true, studyCreated: true },
      pipelineStartTime: Date.now() - 20000,
      ingestionApproved: true,
      qcScore: 89,
      qcReviewed: true,
      qcApproved: true,
      qcResolvedFlags: ['meta', 'proto', 'corrupt'],
      teamName: 'Clinical Review Team',
      teamMembers: [
        { id: '1', name: 'Dr. James Wilson', role: 'Senior Radiologist' },
        { id: '2', name: 'Dr. Maria Santos', role: 'Clinical Reviewer' },
        { id: '3', name: 'Dr. Alex Kim', role: 'AI Specialist' },
      ],
      datasetVersion: 'v2.1',
      auditEnabled: true,
      teamCreated: true,
      hitlApproved: true,
      annotations: p.annotationCount,
      annotationSignedOff: true,
      idpLinkedSources: ['imaging', 'clinical', 'biomarker'],
      idpProcessed: true,
      selectedEnvironment: p.environment,
      selectedAlgorithm: p.algorithm,
      selectedLanguage: 'python',
      algorithmResults: [{ id: '1', name: p.algorithm, accuracy: p.accuracy, auc: p.auc, risk: 'Low' }],
      algorithmsRun: true,
      checkedGates: ['design', 'vv', 'risk', 'regulatory'],
      riskSaved: true,
      compliancePackageGenerated: true,
      managerName: 'Dr. Sarah Chen',
      managerTitle: 'VP Clinical Operations',
      gxpApproved: true,
      deploymentStartTime: null,
      deploymentReviewDecision: 'approved',
      deploymentSignedOff: true,
    };
  }

  // In-progress: ingestion activated, study data pre-filled, rest fresh
  return {
    ...defaultData,
    study: {
      studyName: p.name,
      modality: p.modality,
      cro: p.cro,
      metadataTemplate: 'DICOM + Study Standards v2.1',
      ingestionActivated: true,
      studyCreated: false,
    },
    selectedEnvironment: p.environment,
    selectedAlgorithm: p.algorithm,
  };
}

function getRoleForUsername(username: string): string {
  const u = username.toLowerCase();
  if (u.includes('admin')) return 'Platform Administrator';
  if (u.includes('rad')) return 'Senior Radiologist';
  if (u.includes('qa')) return 'QA Reviewer';
  if (u.includes('sci')) return 'Imaging Scientist';
  if (u.includes('data')) return 'Data Scientist';
  if (u.includes('doc') || u.includes('dr')) return 'Clinical Physician';
  return 'Clinical Researcher';
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WorkflowUser | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [projectsPanelOpen, setProjectsPanelOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<MockProject | null>(null);
  const [currentScreen, setCurrentScreen] = useState(1);
  const [completedScreens, setCompletedScreens] = useState<number[]>([]);
  const [workflowData, setWorkflowData] = useState<WorkflowData>(defaultData);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const loginUser = (username: string) => {
    setUser({ username, role: getRoleForUsername(username) });
  };

  const logoutUser = () => {
    setUser(null);
    setCurrentScreen(1);
    setCompletedScreens([]);
    setWorkflowData(defaultData);
    setViewingProject(null);
    setSavedSession(null);
  };

  const completeScreen = (n: number) => {
    setCompletedScreens(prev => prev.includes(n) ? prev : [...prev, n]);
    if (n === currentScreen) setCurrentScreen(n + 1);
  };

  const updateWorkflowData = (data: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...data }));
  };

  const updateStudy = (data: Partial<StudyData>) => {
    setWorkflowData(prev => ({ ...prev, study: { ...prev.study, ...data } }));
  };

  const resetPipeline = () => {
    setCurrentScreen(1);
    setCompletedScreens([]);
    setWorkflowData(defaultData);
    setViewingProject(null);
    setSavedSession(null);
  };

  const loadProject = (p: MockProject) => {
    // Save current session so it can be restored
    setSavedSession({ workflowData, completedScreens, currentScreen });
    setViewingProject(p);

    const data = projectToWorkflowData(p);
    setWorkflowData(data);

    if (p.status === 'deployed') {
      setCompletedScreens([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      setCurrentScreen(7);
    } else {
      setCompletedScreens([]);
      setCurrentScreen(1);
    }

    setProjectsPanelOpen(false);
  };

  const restoreSession = () => {
    if (savedSession) {
      setWorkflowData(savedSession.workflowData);
      setCompletedScreens(savedSession.completedScreens);
      setCurrentScreen(savedSession.currentScreen);
      setSavedSession(null);
    } else {
      setCurrentScreen(1);
      setCompletedScreens([]);
      setWorkflowData(defaultData);
    }
    setViewingProject(null);
  };

  return (
    <WorkflowContext.Provider value={{
      user, loginUser, logoutUser,
      alertsOpen, setAlertsOpen,
      projectsPanelOpen, setProjectsPanelOpen,
      viewingProject,
      currentScreen, completedScreens, workflowData,
      setCurrentScreen, completeScreen,
      updateWorkflowData, updateStudy, resetPipeline,
      loadProject, restoreSession,
      hasSavedSession: !!savedSession,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be inside WorkflowProvider');
  return ctx;
}
