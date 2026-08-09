import React, { useState } from 'react';
import type { PipelineTelemetry, PipelineStage } from '../types/api';
import { Laptop, Shield, Server, Database, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Activity, Info } from 'lucide-react';
import { PipelineNodeModal } from './PipelineNodeModal';

interface ApiPipelineVisualizerProps {
  telemetry: PipelineTelemetry | null;
}

export const ApiPipelineVisualizer: React.FC<ApiPipelineVisualizerProps> = ({ telemetry }) => {
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);

  const stage = telemetry?.stage || 'IDLE';
  const direction = telemetry?.direction || 'OUTGOING';
  const details = telemetry?.details;

  const isStageActive = (nodeId: string): boolean => {
    switch (nodeId) {
      case 'CLIENT':
        return stage === 'CLIENT' || stage === 'COMPLETE' || stage === 'ERROR';
      case 'SECURITY':
        return stage === 'SECURITY';
      case 'CONTROLLER':
        return stage === 'CONTROLLER';
      case 'SERVICE_DB':
        return stage === 'SERVICE_DB' || stage === 'RESPONSE_RETURN';
      default:
        return false;
    }
  };

  const isStagePassed = (nodeId: string): boolean => {
    if (stage === 'COMPLETE') return true;
    if (stage === 'ERROR') return nodeId === 'CLIENT';

    const order: PipelineStage[] = ['CLIENT', 'SECURITY', 'CONTROLLER', 'SERVICE_DB', 'RESPONSE_RETURN', 'COMPLETE'];
    const currentIndex = order.indexOf(stage);

    if (nodeId === 'CLIENT') return currentIndex > 0;
    if (nodeId === 'SECURITY') return currentIndex > 1;
    if (nodeId === 'CONTROLLER') return currentIndex > 2;
    if (nodeId === 'SERVICE_DB') return currentIndex > 3;

    return false;
  };

  return (
    <div className="pipeline-visualizer glass-panel">
      <div className="pipeline-header">
        <div className="flex-align gap-2">
          <Activity className="text-cyan pulse-icon" size={20} />
          <div>
            <h3 className="pipeline-title">Visual API Pipeline & Architecture Flow</h3>
            <p className="pipeline-subtitle">Live request traversal & return response lifecycle tracking</p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="pipeline-status-bar">
          {stage === 'IDLE' && (
            <span className="badge badge-idle">Ready to Send Request</span>
          )}
          {direction === 'OUTGOING' && stage !== 'IDLE' && (
            <span className="badge badge-outgoing pulse-glow">
              <ArrowRight size={14} className="animate-spin-slow" /> Request Outgoing: {telemetry?.activeNode}
            </span>
          )}
          {direction === 'INCOMING' && stage === 'RESPONSE_RETURN' && (
            <span className="badge badge-incoming pulse-glow">
              <ArrowLeft size={14} className="animate-bounce-horizontal" /> Returning Response Payload...
            </span>
          )}
          {stage === 'COMPLETE' && (
            <span className="badge badge-success">
              <CheckCircle2 size={14} /> Completed {details?.status ? `(${details.status} OK)` : ''} in {details?.responseTimeMs}ms
            </span>
          )}
          {stage === 'ERROR' && (
            <span className="badge badge-danger">
              <AlertCircle size={14} /> Error {details?.status ? `(${details.status})` : ''} - Click Node for details
            </span>
          )}
        </div>
      </div>

      {/* Graphical Node Canvas */}
      <div className="pipeline-canvas">
        {/* Connection Flow Track */}
        <div className={`flow-track ${stage !== 'IDLE' && stage !== 'COMPLETE' && stage !== 'ERROR' ? 'active-flow' : ''}`}>
          <div
            className={`flowing-packet ${direction.toLowerCase()}`}
            style={{
              opacity: stage === 'IDLE' ? 0 : 1,
              left:
                stage === 'CLIENT' ? '12%' :
                stage === 'SECURITY' ? '38%' :
                stage === 'CONTROLLER' ? '64%' :
                stage === 'SERVICE_DB' || stage === 'RESPONSE_RETURN' ? '88%' :
                stage === 'COMPLETE' ? '12%' : '12%'
            }}
          >
            <div className="packet-glow"></div>
          </div>
        </div>

        {/* Node 1: Client */}
        <div
          className={`node-card ${isStageActive('CLIENT') ? 'active' : ''} ${isStagePassed('CLIENT') ? 'passed' : ''}`}
          onClick={() => setInspectedNode('CLIENT')}
        >
          <div className="node-icon-wrapper client-theme">
            <Laptop size={22} />
          </div>
          <div className="node-info">
            <span className="node-title">1. Client Tester</span>
            <span className="node-sub">Frontend App</span>
          </div>
          <button className="node-inspect-btn" title="Inspect Node Data">
            <Info size={12} /> Inspect
          </button>
        </div>

        {/* Node 2: Security */}
        <div
          className={`node-card ${isStageActive('SECURITY') ? 'active' : ''} ${isStagePassed('SECURITY') ? 'passed' : ''}`}
          onClick={() => setInspectedNode('SECURITY')}
        >
          <div className="node-icon-wrapper security-theme">
            <Shield size={22} />
          </div>
          <div className="node-info">
            <span className="node-title">2. Security Filter</span>
            <span className="node-sub">{details?.jwtPresent ? 'JWT Validated' : 'Public Check'}</span>
          </div>
          <button className="node-inspect-btn" title="Inspect Node Data">
            <Info size={12} /> Inspect
          </button>
        </div>

        {/* Node 3: Controller */}
        <div
          className={`node-card ${isStageActive('CONTROLLER') ? 'active' : ''} ${isStagePassed('CONTROLLER') ? 'passed' : ''}`}
          onClick={() => setInspectedNode('CONTROLLER')}
        >
          <div className="node-icon-wrapper controller-theme">
            <Server size={22} />
          </div>
          <div className="node-info">
            <span className="node-title">3. REST Controller</span>
            <span className="node-sub">{details?.method || 'ROUTE'} Mapping</span>
          </div>
          <button className="node-inspect-btn" title="Inspect Node Data">
            <Info size={12} /> Inspect
          </button>
        </div>

        {/* Node 4: Service & DB */}
        <div
          className={`node-card ${isStageActive('SERVICE_DB') ? 'active' : ''} ${isStagePassed('SERVICE_DB') ? 'passed' : ''}`}
          onClick={() => setInspectedNode('SERVICE_DB')}
        >
          <div className="node-icon-wrapper db-theme">
            <Database size={22} />
          </div>
          <div className="node-info">
            <span className="node-title">4. Service & DB</span>
            <span className="node-sub">Spring Data JPA</span>
          </div>
          <button className="node-inspect-btn" title="Inspect Node Data">
            <Info size={12} /> Inspect
          </button>
        </div>
      </div>

      {/* Node Detail Modal Inspector */}
      {inspectedNode && (
        <PipelineNodeModal
          nodeId={inspectedNode}
          telemetry={telemetry}
          onClose={() => setInspectedNode(null)}
        />
      )}
    </div>
  );
};
