import React from 'react';

interface AppShellProps {
  leftSidebar: React.ReactNode;
  reportCanvas: React.ReactNode;
  rightAgentPanel: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  leftSidebar,
  reportCanvas,
  rightAgentPanel,
}) => {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#191919] text-[#F3F4F6] font-sans">
      {/* 1. Left Sidebar (Collapsible 240px -> 64px) */}
      {leftSidebar}

      {/* 2. Central Canvas (flex-1 Report Canvas) */}
      {reportCanvas}

      {/* 3. Right Agent Panel (400px Collapsible/Resizable) */}
      {rightAgentPanel}
    </div>
  );
};
