import React from 'react';
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext';
import WorkflowNav from './components/WorkflowNav';
import AlertsPanel from './components/AlertsPanel';
import LoginScreen from './screens/LoginScreen';
import Screen01 from './screens/Screen01';
import Screen02 from './screens/Screen02';
import Screen03 from './screens/Screen03';
import Screen04 from './screens/Screen04';
import Screen05 from './screens/Screen05';
import Screen06 from './screens/Screen06';
import Screen07 from './screens/Screen07';
import Screen08 from './screens/Screen08';
import Screen09 from './screens/Screen09';
import Screen10 from './screens/Screen10';

const SCREENS: Record<number, React.ComponentType> = {
  1: Screen01, 2: Screen02, 3: Screen03, 4: Screen04, 5: Screen05,
  6: Screen06, 7: Screen07, 8: Screen08, 9: Screen09, 10: Screen10,
};

function AppContent() {
  const { user, currentScreen } = useWorkflow();

  if (!user) return <LoginScreen />;

  const Screen = SCREENS[currentScreen] ?? Screen01;
  return (
    <div className="app-layout">
      <WorkflowNav />
      <main className="screen-content">
        <Screen />
      </main>
      <AlertsPanel />
    </div>
  );
}

export default function App() {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
}
