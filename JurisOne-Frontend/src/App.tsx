import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from './services/apiEndpoints';
import type { EndpointDefinition, PipelineTelemetry } from './types/api';
import { subscribeTelemetry } from './services/apiClient';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ApiPipelineVisualizer } from './components/ApiPipelineVisualizer';
import { PresetsBanner } from './components/PresetsBanner';
import { EndpointTester } from './components/EndpointTester';

export const App: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition>(ENDPOINTS[0]);
  const [telemetry, setTelemetry] = useState<PipelineTelemetry | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTelemetry((t) => {
      setTelemetry(t);
    });
    return () => unsubscribe();
  }, []);

  const handleResetPipeline = () => {
    setTelemetry(null);
  };

  const handleSelectPreset = (endpointId: string, customParams?: Record<string, any>, customBody?: any) => {
    const target = ENDPOINTS.find((ep) => ep.id === endpointId);
    if (target) {
      const cloned = { ...target };
      if (customParams) {
        cloned.params = cloned.params?.map((p) => {
          if (customParams[p.name] !== undefined) {
            return { ...p, defaultValue: customParams[p.name] };
          }
          return p;
        });
      }
      if (customBody) {
        cloned.sampleBody = customBody;
      }
      setSelectedEndpoint(cloned);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <Header onResetPipeline={handleResetPipeline} />

      {/* Main Layout Grid */}
      <div className="main-layout">
        {/* Left Drawer: Endpoint Directory Sidebar */}
        <Sidebar
          endpoints={ENDPOINTS}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={(ep) => setSelectedEndpoint(ep)}
        />

        {/* Right Workspace: Pipeline Visualizer + Endpoint Execution Workbench */}
        <main className="workspace-container">
          {/* Quick Presets Bar */}
          <PresetsBanner
            endpoints={ENDPOINTS}
            onSelectPreset={handleSelectPreset}
          />

          {/* Real-time Animated API Pipeline Visualizer */}
          <ApiPipelineVisualizer telemetry={telemetry} />

          {/* Interactive Endpoint Execution & Response Tester */}
          <EndpointTester endpoint={selectedEndpoint} />
        </main>
      </div>
    </div>
  );
};

export default App;
