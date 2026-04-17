import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StudyData {
  studyName: string;
  modality: string;
  cro: string;
  metadataTemplate: string;
  studyCreated: boolean;
  ingestionActivated: boolean;
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
  study: StudyData;
  ingestionApproved: boolean;
  qcScore: number;
  qcReviewed: boolean;
  qcApproved: boolean;
  teamName: string;
  teamMembers: TeamMember[];
  datasetVersion: string;
  hitlApproved: boolean;
  annotations: number;
  annotationSignedOff: boolean;
  idpProcessed: boolean;
  selectedAlgorithm: string;
  algorithmResults: AlgorithmResult[];
  algorithmsRun: boolean;
  qaApproved: boolean;
  testingApproved: boolean;
  managerSignOff: string;
  gxpApproved: boolean;
  deploymentReviewed: boolean;
  deploymentSignedOff: boolean;
}

interface WorkflowContextType {
  currentScreen: number;
  completedScreens: number[];
  workflowData: WorkflowData;
  setCurrentScreen: (n: number) => void;
  completeScreen: (n: number) => void;
  canAccessScreen: (n: number) => boolean;
  updateWorkflowData: (data: Partial<WorkflowData>) => void;
  updateStudy: (data: Partial<StudyData>) => void;
  resetPipeline: () => void;
}

const defaultData: WorkflowData = {
  study: {
    studyName: 'Oncology Phase II – TA Lung',
    modality: '',
    cro: '',
    metadataTemplate: '',
    studyCreated: false,
    ingestionActivated: false,
  },
  ingestionApproved: false,
  qcScore: 73,
  qcReviewed: false,
  qcApproved: false,
  teamName: '',
  teamMembers: [],
  datasetVersion: '',
  hitlApproved: false,
  annotations: 0,
  annotationSignedOff: false,
  idpProcessed: false,
  selectedAlgorithm: '',
  algorithmResults: [],
  algorithmsRun: false,
  qaApproved: false,
  testingApproved: false,
  managerSignOff: '',
  gxpApproved: false,
  deploymentReviewed: false,
  deploymentSignedOff: false,
};

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [completedScreens, setCompletedScreens] = useState<number[]>([]);
  const [workflowData, setWorkflowData] = useState<WorkflowData>(defaultData);

  const completeScreen = (n: number) => {
    setCompletedScreens(prev => prev.includes(n) ? prev : [...prev, n]);
    if (n === currentScreen) setCurrentScreen(n + 1);
  };

  const canAccessScreen = (n: number) => {
    if (n === 1) return true;
    return completedScreens.includes(n - 1);
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
      currentScreen, completedScreens, workflowData,
      setCurrentScreen, completeScreen, canAccessScreen,
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
