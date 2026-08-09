import React from 'react';
import type { PipelineTelemetry } from '../types/api';
import { X, Shield, Server, Database, Laptop, Key, Code, AlertTriangle } from 'lucide-react';

interface PipelineNodeModalProps {
  nodeId: string;
  telemetry: PipelineTelemetry | null;
  onClose: () => void;
}

export const PipelineNodeModal: React.FC<PipelineNodeModalProps> = ({
  nodeId,
  telemetry,
  onClose
}) => {
  if (!telemetry) return null;

  const { details } = telemetry;

  const getNodeInfo = () => {
    switch (nodeId) {
      case 'CLIENT':
        return { title: 'Frontend Client Tester', icon: <Laptop size={20} className="text-cyan" />, desc: 'Originates HTTP Request payload, injects query/path parameters & initiates telemetry.' };
      case 'SECURITY':
        return { title: 'Spring Security & JWT Filter', icon: <Shield size={20} className="text-amber" />, desc: 'Intercepts incoming request, extracts Bearer token, performs DaoAuthenticationProvider check.' };
      case 'CONTROLLER':
        return { title: 'Spring REST Controller', icon: <Server size={20} className="text-indigo" />, desc: 'Routes URI path to target @RestController, validates @Valid DTO annotations, unpacks request params.' };
      case 'SERVICE_DB':
        return { title: 'Service Business Logic & DB', icon: <Database size={20} className="text-emerald" />, desc: 'Executes Spring Data JPA transaction queries against MySQL database & builds response DTO.' };
      default:
        return { title: 'Pipeline Architecture Node', icon: <Server size={20} />, desc: 'System component processing API traffic.' };
    }
  };

  const info = getNodeInfo();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex-align gap-2">
            {info.icon}
            <div>
              <h3 className="modal-title">{info.title}</h3>
              <p className="modal-subtitle">{info.desc}</p>
            </div>
          </div>
          <button className="btn-icon-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body scrollable">
          {/* Node Summary Metrics */}
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-label">HTTP Method</span>
              <span className="metric-value text-cyan">{details.method || 'GET'}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Status Code</span>
              <span className={`metric-value ${details.status && details.status < 300 ? 'text-emerald' : 'text-ruby'}`}>
                {details.status ? `${details.status} ${details.statusText || ''}` : 'Processing...'}
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-label">JWT Bearer Header</span>
              <span className={`metric-value small-text ${details.jwtPresent ? 'text-emerald' : 'text-amber'}`}>
                {details.jwtPresent ? 'VALIDATED' : 'ANONYMOUS'}
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Latency</span>
              <span className="metric-value text-indigo">{details.responseTimeMs ? `${details.responseTimeMs}ms` : 'In Flight...'}</span>
            </div>
          </div>

          {/* URL & Headers */}
          <div className="detail-section">
            <h4 className="section-heading"><Code size={14} /> Target Endpoint URL</h4>
            <code className="code-block">{details.url || 'N/A'}</code>
          </div>

          {/* Security Node Specifics */}
          {nodeId === 'SECURITY' && (
            <div className="detail-section">
              <h4 className="section-heading"><Key size={14} /> Security Interceptor Audit</h4>
              <div className="info-card">
                <p><strong>Auth Token:</strong> {details.tokenSnippet || 'None'}</p>
                <p><strong>Rule Status:</strong> {details.jwtPresent ? 'Permitted with JWT Bearer claims' : 'Evaluated against permitAll() public rules'}</p>
              </div>
            </div>
          )}

          {/* Request Headers */}
          {details.headers && (
            <div className="detail-section">
              <h4 className="section-heading">Active HTTP Headers</h4>
              <pre className="json-pre">{JSON.stringify(details.headers, null, 2)}</pre>
            </div>
          )}

          {/* Payload Data */}
          {details.requestBody && (
            <div className="detail-section">
              <h4 className="section-heading">Request Payload Body</h4>
              <pre className="json-pre">{JSON.stringify(details.requestBody, null, 2)}</pre>
            </div>
          )}

          {/* Response Payload */}
          {details.responseBody && (
            <div className="detail-section">
              <h4 className="section-heading">Node Response Output</h4>
              <pre className="json-pre">{JSON.stringify(details.responseBody, null, 2)}</pre>
            </div>
          )}

          {details.errorMsg && (
            <div className="detail-section alert-error">
              <AlertTriangle size={16} />
              <span>{details.errorMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Inspector</button>
        </div>
      </div>
    </div>
  );
};
