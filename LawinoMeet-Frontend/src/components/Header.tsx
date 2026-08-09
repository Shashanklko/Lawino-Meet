import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getBaseUrl, setBaseUrl, getJwtToken, clearJwtToken, setJwtToken,
  isTokenModeActive, setTokenModeActive
} from '../services/apiClient';
import {
  ShieldCheck, Key, RefreshCw, Server, LogOut,
  ToggleLeft, ToggleRight, Edit3, Check,
  Wifi, WifiOff, Play, Terminal, Copy, X, ChevronDown
} from 'lucide-react';

interface HeaderProps {
  onResetPipeline: () => void;
}

type ServerStatus = 'checking' | 'online' | 'offline';

const START_CMD = 'set JAVA_HOME=C:\\Program Files\\Microsoft\\jdk-21.0.10.7-hotspot && mvn spring-boot:run';
const START_CMD_SHORT = 'mvn spring-boot:run';

export const Header: React.FC<HeaderProps> = ({ onResetPipeline }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(getBaseUrl());
  const [token, setTokenState] = useState<string | null>(getJwtToken());
  const [tokenMode, setTokenModeState] = useState<boolean>(isTokenModeActive());
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(baseUrl);
  const [isEditingToken, setIsEditingToken] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>('');

  // Server health state
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [showStartPanel, setShowStartPanel] = useState<boolean>(false);
  const [cmdCopied, setCmdCopied] = useState<boolean>(false);
  const [isRechecking, setIsRechecking] = useState<boolean>(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ping backend health
  const checkServerHealth = useCallback(async (silent = false) => {
    if (!silent) setIsRechecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: 'OPTIONS',
        signal: controller.signal,
        mode: 'no-cors'
      });
      clearTimeout(timeout);
      setServerStatus('online');
      setShowStartPanel(false);
    } catch {
      setServerStatus('offline');
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
      if (!silent) setIsRechecking(false);
    }
  }, []);

  // Auto-ping every 15 seconds
  useEffect(() => {
    checkServerHealth(true);
    pingIntervalRef.current = setInterval(() => checkServerHealth(true), 15000);
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [checkServerHealth]);

  useEffect(() => {
    const handleTokenChange = (e: CustomEvent) => setTokenState(e.detail);
    const handleTokenModeChange = (e: CustomEvent) => setTokenModeState(e.detail);
    window.addEventListener('token-updated', handleTokenChange as EventListener);
    window.addEventListener('token-mode-updated', handleTokenModeChange as EventListener);
    return () => {
      window.removeEventListener('token-updated', handleTokenChange as EventListener);
      window.removeEventListener('token-mode-updated', handleTokenModeChange as EventListener);
    };
  }, []);

  const handleSaveUrl = () => {
    let url = tempUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    setBaseUrl(url);
    setBaseUrlState(url);
    setIsEditingUrl(false);
    // Re-check health against new URL
    setTimeout(() => checkServerHealth(true), 300);
  };

  const handleClearToken = () => clearJwtToken();

  const handleToggleTokenMode = () => {
    const next = !tokenMode;
    setTokenModeActive(next);
    setTokenModeState(next);
  };

  const handleSaveCustomToken = () => {
    if (tempToken.trim()) setJwtToken(tempToken.trim());
    setIsEditingToken(false);
    setTempToken('');
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(START_CMD);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  return (
    <>
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

          {/* 🟢 Server Health Status */}
          <div
            className={`server-health-badge ${serverStatus}`}
            title={`Last checked: ${lastChecked || 'pending...'}`}
            onClick={() => serverStatus === 'offline' && setShowStartPanel((v) => !v)}
          >
            {serverStatus === 'online' && <Wifi size={14} className="text-emerald" />}
            {serverStatus === 'offline' && <WifiOff size={14} className="text-ruby" />}
            {serverStatus === 'checking' && <RefreshCw size={14} className="animate-spin text-amber" />}

            <div className="server-health-text">
              <span className={`server-health-label ${serverStatus}`}>
                {serverStatus === 'online' ? 'Backend Online' : serverStatus === 'offline' ? 'Backend Offline' : 'Checking...'}
              </span>
              <span className="server-health-url">{baseUrl.replace('http://', '')}</span>
            </div>

            {serverStatus === 'offline' && (
              <span className="start-server-hint">
                <Play size={11} /> Start <ChevronDown size={11} />
              </span>
            )}

            <button
              className="recheck-btn"
              onClick={(e) => { e.stopPropagation(); checkServerHealth(false); }}
              title="Re-check server connection"
              disabled={isRechecking}
            >
              <RefreshCw size={12} className={isRechecking ? 'animate-spin' : ''} />
            </button>
          </div>

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
                <span className={`badge small-badge ${serverStatus === 'online' ? 'badge-success' : 'badge-danger'}`}>
                  {serverStatus === 'online' ? 'Live' : serverStatus === 'offline' ? 'Down' : '...'}
                </span>
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

      {/* 🚀 Start Server Panel — appears when backend is offline */}
      {showStartPanel && serverStatus === 'offline' && (
        <div className="start-server-panel glass-panel">
          <div className="start-panel-header">
            <div className="start-panel-title">
              <Terminal size={18} className="text-amber" />
              <span>Backend Server is Offline</span>
            </div>
            <button className="btn-icon-muted" onClick={() => setShowStartPanel(false)}>
              <X size={16} />
            </button>
          </div>

          <p className="start-panel-desc">
            The backend at <code>{baseUrl}</code> is not responding. Run the command below in a terminal inside the <strong>LawEZY-Backend</strong> directory to start the Spring Boot server.
          </p>

          <div className="start-cmd-block">
            <span className="cmd-prompt">$</span>
            <code className="cmd-text">{START_CMD_SHORT}</code>
            <button className="copy-cmd-btn" onClick={handleCopyCmd} title="Copy full start command with JAVA_HOME">
              {cmdCopied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{cmdCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="start-panel-note">
            <span className="note-label">Full command (with JDK 21 path):</span>
            <code className="note-cmd">{START_CMD}</code>
          </div>

          <div className="start-panel-actions">
            <button
              className="btn btn-primary btn-sm flex-center gap-2"
              onClick={() => checkServerHealth(false)}
              disabled={isRechecking}
            >
              <RefreshCw size={14} className={isRechecking ? 'animate-spin' : ''} />
              {isRechecking ? 'Checking...' : 'Re-check Connection'}
            </button>
            <span className="start-panel-tip">
              ⚡ The indicator auto-checks every 15 seconds
            </span>
          </div>
        </div>
      )}
    </>
  );
};
