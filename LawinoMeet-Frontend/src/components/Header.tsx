import React, { useState, useEffect } from 'react';
import {
  getBaseUrl, setBaseUrl, getJwtToken, clearJwtToken, setJwtToken,
  isTokenModeActive, setTokenModeActive
} from '../services/apiClient';
import { ShieldCheck, Key, RefreshCw, Server, LogOut, ToggleLeft, ToggleRight, Edit3, Check } from 'lucide-react';

interface HeaderProps {
  onResetPipeline: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetPipeline }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(getBaseUrl());
  const [token, setTokenState] = useState<string | null>(getJwtToken());
  const [tokenMode, setTokenModeState] = useState<boolean>(isTokenModeActive());
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(baseUrl);
  const [isEditingToken, setIsEditingToken] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>('');

  useEffect(() => {
    const handleTokenChange = (e: CustomEvent) => {
      setTokenState(e.detail);
    };
    const handleTokenModeChange = (e: CustomEvent) => {
      setTokenModeState(e.detail);
    };
    window.addEventListener('token-updated', handleTokenChange as EventListener);
    window.addEventListener('token-mode-updated', handleTokenModeChange as EventListener);
    return () => {
      window.removeEventListener('token-updated', handleTokenChange as EventListener);
      window.removeEventListener('token-mode-updated', handleTokenModeChange as EventListener);
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

  const handleToggleTokenMode = () => {
    const next = !tokenMode;
    setTokenModeActive(next);
    setTokenModeState(next);
  };

  const handleSaveCustomToken = () => {
    if (tempToken.trim()) {
      setJwtToken(tempToken.trim());
    }
    setIsEditingToken(false);
    setTempToken('');
  };

  return (
    <header className="header-bar glass-panel">
      <div className="header-left">
        <div className="logo-badge">
          <ShieldCheck className="logo-icon text-cyan" size={24} />
          <div>
            <h1 className="logo-title">Lawino Meet <span className="text-highlight">Pipeline Studio</span></h1>
            <p className="logo-subtitle">TypeScript Visual API Tester &amp; Lifecycle Flow</p>
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

        {/* 🔐 Token Mode Toggle */}
        <div className={`token-mode-toggle ${tokenMode ? 'mode-on' : 'mode-off'}`}>
          <button
            className="token-mode-btn"
            onClick={handleToggleTokenMode}
            title={tokenMode ? 'Token Mode ON — click to disable JWT on requests' : 'Token Mode OFF — click to enable JWT on requests'}
          >
            {tokenMode
              ? <ToggleRight size={20} className="text-emerald" />
              : <ToggleLeft size={20} className="text-amber" />
            }
            <span className="token-mode-label">
              Send JWT: <strong>{tokenMode ? 'ON' : 'OFF'}</strong>
            </span>
          </button>
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

          {/* Paste custom token */}
          {isEditingToken ? (
            <div className="token-edit-group">
              <input
                type="text"
                className="input-field small-input"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder="Paste JWT token here..."
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCustomToken(); }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleSaveCustomToken} title="Set Token">
                <Check size={12} />
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsEditingToken(false)}>✕</button>
            </div>
          ) : (
            <button className="btn-icon-muted" onClick={() => { setIsEditingToken(true); setTempToken(''); }} title="Paste a custom JWT token">
              <Edit3 size={14} />
            </button>
          )}

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
