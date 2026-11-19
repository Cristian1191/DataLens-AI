import React from 'react';
import { AgentSkill, QueryFilters } from './types/agent';
import { MOCK_REPORTS_DATABASE } from './data/mockReports';
import { AppShell } from './components/layout/AppShell';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { ReportCanvas } from './components/report/ReportCanvas';
import { RightAgentPanel } from './components/right-panel/RightAgentPanel';
import { useOrchestration } from './hooks/useOrchestration';

export const App: React.FC = () => {
  const {
    activeReport,
    interpretation,
    isGenerating,
    agentSteps,
    messages,
    executeQuery,
    resetToNewQuery,
    setActiveReport,
  } = useOrchestration();

  // Handle new blank state
  const handleNewQuery = () => {
    resetToNewQuery();
  };

  // Handle user message from QueryBox
  const handleSendMessage = (
    query: string,
    options: { skill: AgentSkill; isDeep: boolean; filters: QueryFilters }
  ) => {
    executeQuery(query, {
      skill: options.skill,
      isDeep: options.isDeep,
    });
  };

  // Handle refinement from RightAgentPanel
  const handleApplyRefinement = (refinementText: string) => {
    executeQuery(refinementText);
  };

  // Handle history item selection
  const handleSelectHistoryItem = (id: string) => {
    const report = MOCK_REPORTS_DATABASE['default'];
    setActiveReport({
      ...report,
      id,
    });
  };

  return (
    <AppShell
      leftSidebar={
        <LeftSidebar
          onNewQuery={handleNewQuery}
          activeReportId={activeReport?.id}
          onSelectHistoryItem={handleSelectHistoryItem}
        />
      }
      reportCanvas={
        <ReportCanvas
          activeReport={activeReport}
          isGenerating={isGenerating}
          agentSteps={agentSteps}
          interpretation={interpretation}
          onSelectSampleQuery={(sampleQuery) => executeQuery(sampleQuery)}
        />
      }
      rightAgentPanel={
        <RightAgentPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onApplyRefinement={handleApplyRefinement}
          isGenerating={isGenerating}
        />
      }
    />
  );
};

export default App;
