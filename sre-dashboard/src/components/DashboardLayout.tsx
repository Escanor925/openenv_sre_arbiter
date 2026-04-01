import { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { TelemetryGrid } from './TelemetryGrid';
import { IncidentFeed } from './IncidentFeed';
import { ActionConsole } from './ActionConsole';
import { HealthHeatmap } from './HealthHeatmap';
import { ScenarioInjector } from './ScenarioInjector';
import { EmptyState } from './EmptyState';
import { useEpisode } from '../hooks/useEpisode';

export function DashboardLayout() {
  const episode = useEpisode();
  const [isConnected, setIsConnected] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Health check on mount
  useEffect(() => {
    fetch('/health')
      .then((r) => {
        if (r.ok) setIsConnected(true);
      })
      .catch(() => setIsConnected(false));
  }, []);

  // Ctrl+Shift+D to toggle dev tools
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDevToolsOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInject = useCallback(
    (taskName: 'easy' | 'medium' | 'hard') => {
      setDevToolsOpen(false);
      episode.reset(taskName);
    },
    [episode],
  );

  const hasEpisode = episode.observation !== null;

  return (
    <div className="flex flex-col h-screen bg-sre-bg">
      <Header state={episode.state} isConnected={isConnected} />

      {/* Error Banner */}
      {episode.error && (
        <div className="px-6 py-2 bg-sre-red-dim border-b border-sre-red/30 text-xs font-mono text-sre-red">
          ERROR: {episode.error}
        </div>
      )}

      {/* 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane — Telemetry */}
        <div className="w-80 border-r border-sre-border flex flex-col overflow-y-auto">
          <div className="px-4 py-2 border-b border-sre-border bg-sre-surface/60">
            <span className="text-xs font-mono text-sre-text-muted tracking-wider">TELEMETRY</span>
          </div>
          <TelemetryGrid
            observation={episode.observation}
            history={episode.history}
          />
          <div className="border-t border-sre-border">
            <HealthHeatmap observation={episode.observation} />
          </div>
        </div>

        {/* Center Pane — Incident Feed or Empty State */}
        <div className="flex-1 flex flex-col min-w-0">
          {hasEpisode ? (
            <IncidentFeed
              observation={episode.observation}
              history={episode.history}
              isAutopiloting={episode.isAutopiloting}
              healerTriggered={episode.healerTriggered}
              aiRawResponse={episode.aiRawResponse}
              reward={episode.reward}
              isDone={episode.isDone}
            />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Right Pane — Action Console */}
        <div className="w-80 border-l border-sre-border flex flex-col">
          <ActionConsole
            onSubmit={episode.step}
            onAutopilot={episode.autopilot}
            onReset={episode.reset}
            isLoading={episode.isLoading}
            isAutopiloting={episode.isAutopiloting}
            isDone={episode.isDone}
            hasEpisode={hasEpisode}
          />
        </div>
      </div>

      {/* Scenario Injector (Dev Tools) */}
      <ScenarioInjector
        isOpen={devToolsOpen}
        onClose={() => setDevToolsOpen(false)}
        onInject={handleInject}
        isLoading={episode.isLoading}
      />
    </div>
  );
}
