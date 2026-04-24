import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface WorkflowUser {
  username: string;
  role: string;
}

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
  id: string;
  name: string;
  accuracy: number;
  auc: number;
  risk: 'Low' | 'Medium' | 'High';
}

export interface WorkflowData {
  // Screen 1
  study: StudyData;
  // Screen 2
  pipelineStartTime: number | null;
  ingestionApproved: boolean;
  // Screen 3
  qcScore: number;
  qcReviewed: boolean;
  qcApproved: boolean;
  qcResolvedFlags: string[];
  // Screen 4
  teamName: string;
  teamMembers: TeamMember[];
  datasetVersion: string;
  auditEnabled: boolean;
  teamCreated: boolean;
  hitlApproved: boolean;
  // Screen 5
  annotations: number;
  annotationSignedOff: boolean;
  // Screen 6
  idpLinkedSources: string[];
  idpProcessed: boolean;
  // Screen 7
  selectedEnvironment: string;
  selectedAlgorithm: string;
  selectedLanguage: string;
  algorithmResults: AlgorithmResult[];
  algorithmsRun: boolean;
  // Screen 8
  checkedGates: string[];
  riskSaved: boolean;
  compliancePackageGenerated: boolean;
  managerName: string;
  managerTitle: string;
  gxpApproved: boolean;
  // Screen 9
  deploymentStartTime: number | null;
  deploymentReviewDecision: 'approved' | 'rejected' | null;
  deploymentSignedOff: boolean;
}

interface WorkflowContextType {
  user: WorkflowUser | null;
  loginUser: (username: string) => void;
  logoutUser: () => void;
  alertsOpen: boolean;
  setAlertsOpen: (open: boolean) => void;
  currentScreen: number;
  completedScreens: number[];
  workflowData: WorkflowData;
  setCurrentScreen: (n: number) => void;
  completeScreen: (n: number) => void;
  updateWorkflowData: (data: Partial<WorkflowData>) => void;
  updateStudy: (data: Partial<StudyData>) => void;
  resetPipeline: () => void;
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
  const [currentScreen, setCurrentScreen] = useState(1);
  const [completedScreens, setCompletedScreens] = useState<number[]>([]);
  const [workflowData, setWorkflowData] = useState<WorkflowData>(defaultData);

  const loginUser = (username: string) => {
    setUser({ username, role: getRoleForUsername(username) });
  };

  const logoutUser = () => {
    setUser(null);
    setCurrentScreen(1);
    setCompletedScreens([]);
    setWorkflowData(defaultData);
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
  };

  return (
    <WorkflowContext.Provider value={{
      user, loginUser, logoutUser,
      alertsOpen, setAlertsOpen,
      currentScreen, completedScreens, workflowData,
      setCurrentScreen, completeScreen,
      updateWorkflowData, updateStudy, resetPipeline,
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
