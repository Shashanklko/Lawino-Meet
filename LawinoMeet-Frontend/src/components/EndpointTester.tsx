import React, { useState, useEffect } from 'react';
import type { EndpointDefinition } from '../types/api';
import { executeApiCall, isTokenModeActive, getJwtToken } from '../services/apiClient';
import confetti from 'canvas-confetti';
import { Send, Play, Copy, Check, RefreshCw, Code, Lock, AlertCircle, Clock, Database, Layers, ShieldCheck, ShieldOff } from 'lucide-react';

interface EndpointTesterProps {
  endpoint: EndpointDefinition;
}

export const EndpointTester: React.FC<EndpointTesterProps> = ({ endpoint }) => {
  const [pathParams, setPathParams] = useState<Record<string, any>>({});
  const [queryParams, setQueryParams] = useState<Record<string, any>>({});
  const [bodyText, setBodyText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseResult, setResponseResult] = useState<{
    status?: number;
    data?: any;
    durationMs?: number;
    headers?: any;
    error?: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'BODY' | 'HEADERS'>('BODY');
  const [tokenMode, setTokenMode] = useState<boolean>(isTokenModeActive());
  const [hasToken, setHasToken] = useState<boolean>(!!getJwtToken());

  useEffect(() => {
    const handleTokenModeChange = (e: CustomEvent) => setTokenMode(e.detail);
    const handleTokenChange = (e: CustomEvent) => setHasToken(!!e.detail);
    window.addEventListener('token-mode-updated', handleTokenModeChange as EventListener);
    window.addEventListener('token-updated', handleTokenChange as EventListener);
    return () => {
      window.removeEventListener('token-mode-updated', handleTokenModeChange as EventListener);
      window.removeEventListener('token-updated', handleTokenChange as EventListener);
    };
  }, []);

  // Initialize input fields when endpoint changes
  useEffect(() => {
    const initialPathParams: Record<string, any> = {};
    const initialQueryParams: Record<string, any> = {};

    if (endpoint.params) {
      endpoint.params.forEach((param) => {
        if (param.in === 'path') {
          initialPathParams[param.name] = param.defaultValue !== undefined ? param.defaultValue : '';
        } else if (param.in === 'query') {
          initialQueryParams[param.name] = param.defaultValue !== undefined ? param.defaultValue : '';
        }
      });
    }

    setPathParams(initialPathParams);
    setQueryParams(initialQueryParams);
    setResponseResult(null);

    if (endpoint.sampleBody) {
      setBodyText(JSON.stringify(endpoint.sampleBody, null, 2));
    } else {
      setBodyText('');
    }
    setJsonError(null);
  }, [endpoint]);

  const handlePathChange = (name: string, value: string) => {
    setPathParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleQueryChange = (name: string, value: string) => {
    setQueryParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (value: string) => {
    setBodyText(value);
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handlePreFillSample = () => {
    if (endpoint.sampleBody) {
      setBodyText(JSON.stringify(endpoint.sampleBody, null, 2));
      setJsonError(null);
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseResult(null);

    let parsedBody = undefined;
    if (bodyText.trim() && endpoint.method !== 'GET') {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (e) {
        setJsonError('Invalid JSON Body');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await executeApiCall({
        method: endpoint.method,
        url: endpoint.path,
        pathParams,
        queryParams,
        body: parsedBody
      });

      setResponseResult(res);

      if (res.status >= 200 && res.status < 300) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (err: any) {
      setResponseResult(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseResult) return;
    const textToCopy = typeof responseResult.data === 'object'
      ? JSON.stringify(responseResult.data, null, 2)
      : String(responseResult.data);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      default: return 'method-get';
    }
  };

  return (
    <div className="endpoint-tester glass-panel">
      {/* Endpoint Header Info */}
      <div className="tester-header">
        <div className="tester-title-group">
          <span className={`method-badge ${getMethodBadgeClass(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <code className="tester-path">{endpoint.path}</code>
          {endpoint.requiresAuth && (
            <span className="auth-badge" title="Authorization Header Required">
              <Lock size={12} /> Bearer JWT
            </span>
          )}
        </div>
        <p className="tester-description">{endpoint.description}</p>
      </div>

      <div className="tester-grid">
        {/* LEFT COLUMN: Request Construction */}
        <div className="request-builder">
          <h3 className="section-title"><Layers size={16} /> Request Parameters & Payload</h3>

          {/* Path Parameters Inputs */}
          {endpoint.params && endpoint.params.some((p) => p.in === 'path') && (
            <div className="param-group">
              <label className="param-group-label">Path Variables</label>
              {endpoint.params.filter((p) => p.in === 'path').map((param) => (
                <div key={param.name} className="input-row">
                  <span className="param-name">{param.name}:</span>
                  <input
                    type="text"
                    className="input-field"
                    value={pathParams[param.name] ?? ''}
                    onChange={(e) => handlePathChange(param.name, e.target.value)}
                    placeholder={param.description || param.name}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query Parameters Inputs */}
          {endpoint.params && endpoint.params.some((p) => p.in === 'query') && (
            <div className="param-group">
              <label className="param-group-label">Query String Parameters</label>
              {endpoint.params.filter((p) => p.in === 'query').map((param) => (
                <div key={param.name} className="input-row">
                  <span className="param-name">{param.name}:</span>
                  <input
                    type="text"
                    className="input-field"
                    value={queryParams[param.name] ?? ''}
                    onChange={(e) => handleQueryChange(param.name, e.target.value)}
                    placeholder={param.description || param.name}
                  />
                </div>
              ))}
            </div>
          )}

          {/* JSON Body Editor */}
          {endpoint.method !== 'GET' && (
            <div className="param-group">
              <div className="flex-between margin-bottom-sm">
                <label className="param-group-label flex-align gap-1">
                  <Code size={14} /> Request Body (JSON)
                </label>
                {endpoint.sampleBody && (
                  <button className="btn-text-action" onClick={handlePreFillSample}>
                    <RefreshCw size={12} /> Auto-fill Sample Body
                  </button>
                )}
              </div>
              <textarea
                className={`textarea-field ${jsonError ? 'input-error' : ''}`}
                rows={8}
                value={bodyText}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Enter JSON payload request body..."
              />
              {jsonError && (
                <span className="error-text">
                  <AlertCircle size={12} /> {jsonError}
                </span>
              )}
            </div>
          )}

          {/* Token Mode Indicator + Execute Action Button */}
          <div className="action-row">
            <div className={`token-mode-indicator ${tokenMode && hasToken ? 'indicator-active' : tokenMode && !hasToken ? 'indicator-no-token' : 'indicator-off'}`}>
              {tokenMode && hasToken
                ? <><ShieldCheck size={13} className="text-emerald" /> JWT will be sent</>  
                : tokenMode && !hasToken
                ? <><ShieldOff size={13} className="text-amber" /> No token stored — request unauthenticated</>
                : <><ShieldOff size={13} className="text-muted" /> Token Mode OFF — request sent without JWT</>
              }
            </div>
            <button
              className="btn btn-primary btn-lg flex-center gap-2 full-width"
              onClick={handleExecute}
              disabled={isLoading || !!jsonError}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Processing through Pipeline...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Request &amp; Trigger Pipeline Flow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Response Inspector */}
        <div className="response-inspector">
          <div className="flex-between margin-bottom-md">
            <h3 className="section-title flex-align gap-2">
              <Database size={16} /> Live Response Output
            </h3>
            {responseResult && (
              <div className="flex-align gap-2">
                <button className="btn btn-sm btn-secondary" onClick={handleCopyResponse}>
                  {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
            )}
          </div>

          {!responseResult && !isLoading && (
            <div className="response-placeholder">
              <Play size={32} className="placeholder-icon" />
              <h4>No Response Yet</h4>
              <p>Click "Send Request & Trigger Pipeline Flow" to execute this API endpoint.</p>
            </div>
          )}

          {isLoading && (
            <div className="response-placeholder loading-state">
              <RefreshCw size={36} className="animate-spin text-cyan" />
              <h4>Request in Flight</h4>
              <p>Watch the animated visual pipeline above for real-time node traversal...</p>
            </div>
          )}

          {responseResult && (
            <div className="response-content">
              {/* Response Status Bar */}
              <div className="response-meta-bar">
                <div className="flex-align gap-2">
                  <span className={`status-badge ${responseResult.status && responseResult.status < 300 ? 'status-2xx' : 'status-4xx'}`}>
                    HTTP {responseResult.status || 500}
                  </span>
                  {responseResult.durationMs && (
                    <span className="timing-badge">
                      <Clock size={12} /> {responseResult.durationMs} ms
                    </span>
                  )}
                </div>

                <div className="tab-switcher">
                  <button
                    className={`tab-btn ${activeTab === 'BODY' ? 'active' : ''}`}
                    onClick={() => setActiveTab('BODY')}
                  >
                    Body
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'HEADERS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('HEADERS')}
                  >
                    Headers
                  </button>
                </div>
              </div>

              {/* Response Code Output */}
              <div className="code-viewer scrollable">
                {activeTab === 'BODY' ? (
                  <pre className="json-output">
                    {typeof responseResult.data === 'object'
                      ? JSON.stringify(responseResult.data, null, 2)
                      : responseResult.data || 'No content returned.'}
                  </pre>
                ) : (
                  <pre className="json-output">
                    {JSON.stringify(responseResult.headers || {}, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
