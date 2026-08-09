import React, { useState, useEffect } from 'react';
import { getBaseUrl, setBaseUrl, getJwtToken, clearJwtToken } from '../services/apiClient';
import { ShieldCheck, Key, RefreshCw, Server, LogOut } from 'lucide-react';

interface HeaderProps {
  onResetPipeline: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetPipeline }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(getBaseUrl());
  const [token, setTokenState] = useState<string | null>(getJwtToken());
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(baseUrl);

  useEffect(() => {
    const handleTokenChange = (e: CustomEvent) => {
      setTokenState(e.detail);
    };
    window.addEventListener('token-updated', handleTokenChange as EventListener);
    return () => {
      window.removeEventListener('token-updated', handleTokenChange as EventListener);
    };
  }, []);

  const handleSaveUrl = () => {
    let url = tempUrl.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    setBaseUrl(url);
    setBaseUrlState(url);
    setIsEditingUrl(false);
  };

  const handleClearToken = () => {
    clearJwtToken();
  };

  return (
    <header className="header-bar glass-panel">
      <div className="header-left">
        <div className="logo-badge">
          <ShieldCheck className="logo-icon text-cyan" size={24} />
          <div>
            <h1 className="logo-title">Lawino Meet <span className="text-highlight">Pipeline Studio</span></h1>
            <p className="logo-subtitle">TypeScript Visual API Tester & Lifecycle Flow</p>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Backend Target URL Switcher */}
        <div className="server-status-card">
          <Server size={16} className="text-cyan" />
          <span className="text-muted small-text">Server:</span>
          {isEditingUrl ? (
            <div className="url-edit-group">
              <input
                type="text"
                className="input-field small-input"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="http://localhost:8080"
              />
              <button className="btn btn-sm btn-primary" onClick={handleSaveUrl}>Save</button>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsEditingUrl(false)}>Cancel</button>
            </div>
          ) : (
            <div className="url-display" onClick={() => setIsEditingUrl(true)} title="Click to change Backend Base URL">
              <span className="url-text">{baseUrl}</span>
              <span className="badge badge-success small-badge">Live</span>
            </div>
          )}
        </div>

        {/* JWT Auth Token Badge */}
        <div className={`token-status-card ${token ? 'authenticated' : 'anonymous'}`}>
          <Key size={16} className={token ? 'text-emerald' : 'text-amber'} />
          <div className="token-info">
            <div className="token-header">
              <span className="token-label">Auth Token:</span>
              <span className={`status-dot ${token ? 'active' : 'inactive'}`}></span>
              <span className="status-text">{token ? 'Bearer Active' : 'No Token'}</span>
            </div>
            {token ? (
              <span className="token-snippet" title={token}>
                {token.substring(0, 12)}...{token.slice(-8)}
              </span>
            ) : (
              <span className="token-snippet text-amber">Public Requests Only</span>
            )}
          </div>
          {token && (
            <button className="btn-icon-danger" onClick={handleClearToken} title="Clear saved JWT Token">
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Reset Visual Pipeline */}
        <button className="btn btn-secondary btn-icon-label" onClick={onResetPipeline} title="Reset Visual Flow Canvas">
          <RefreshCw size={16} />
          <span>Reset Canvas</span>
        </button>
      </div>
    </header>
  );
};
