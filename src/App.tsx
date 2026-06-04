import { useState } from 'react';
import ProjectList from './components/ProjectList';
import Questionnaire from './components/Questionnaire';
import RiskLog from './components/RiskLog';
import RiskDetail from './components/RiskDetail';
import RiskLibrary from './components/RiskLibrary';

type View = 'home' | 'questionnaire' | 'risk-log' | 'risk-detail' | 'risk-library';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [riskId, setRiskId] = useState<string | null>(null);

  const goHome = () => { setView('home'); setProjectId(null); setRiskId(null); };
  const goRiskLibrary = () => setView('risk-library');
  const goQuestionnaire = (id?: string) => { setProjectId(id ?? null); setView('questionnaire'); };
  const goRiskLog = (id: string) => { setProjectId(id); setView('risk-log'); };
  const goRiskDetail = (pid: string, rid: string) => { setProjectId(pid); setRiskId(rid); setView('risk-detail'); };

  if (view === 'questionnaire') {
    return (
      <Questionnaire
        projectId={projectId}
        onComplete={goRiskLog}
        onCancel={goHome}
      />
    );
  }

  if (view === 'risk-log' && projectId) {
    return (
      <RiskLog
        projectId={projectId}
        onBack={goHome}
        onEditProject={() => goQuestionnaire(projectId)}
        onSelectRisk={rid => goRiskDetail(projectId, rid)}
      />
    );
  }

  if (view === 'risk-library') {
    return <RiskLibrary onBack={goHome} />;
  }

  if (view === 'risk-detail' && projectId && riskId) {
    return (
      <RiskDetail
        projectId={projectId}
        riskId={riskId}
        onBack={() => goRiskLog(projectId)}
      />
    );
  }

  return (
    <ProjectList
      onNewProject={() => goQuestionnaire()}
      onOpenProject={goRiskLog}
      onViewLibrary={goRiskLibrary}
    />
  );
}
