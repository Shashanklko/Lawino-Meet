import React, { useState } from 'react';
import type { EndpointDefinition, ServiceModule } from '../types/api';
import { Search, Lock, User, Calendar, CreditCard, Wallet, LayoutDashboard, MessageSquare, Shield, ChevronRight } from 'lucide-react';

interface SidebarProps {
  endpoints: EndpointDefinition[];
  selectedEndpoint: EndpointDefinition | null;
  onSelectEndpoint: (endpoint: EndpointDefinition) => void;
}

const MODULE_METADATA: Record<ServiceModule, { label: string; icon: React.ReactNode; color: string }> = {
  AUTH: { label: 'Auth & Login', icon: <Lock size={16} />, color: 'var(--amber-color)' },
  USERS: { label: 'User Management', icon: <User size={16} />, color: 'var(--cyan-color)' },
  CONSULTATIONS: { label: 'Consultations', icon: <Calendar size={16} />, color: 'var(--indigo-color)' },
  PAYMENTS: { label: 'Payments', icon: <CreditCard size={16} />, color: 'var(--emerald-color)' },
  PAYOUTS: { label: 'Payouts & Wallet', icon: <Wallet size={16} />, color: 'var(--emerald-color)' },
  DASHBOARD: { label: 'Dashboards', icon: <LayoutDashboard size={16} />, color: 'var(--purple-color)' },
  CHAT: { label: 'Chat Sessions', icon: <MessageSquare size={16} />, color: 'var(--cyan-color)' },
  ADMIN: { label: 'Admin Governance', icon: <Shield size={16} />, color: 'var(--ruby-color)' }
};

export const Sidebar: React.FC<SidebarProps> = ({
  endpoints,
  selectedEndpoint,
  onSelectEndpoint
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<ServiceModule | 'ALL'>('ALL');

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch = 
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModuleFilter === 'ALL' || ep.module === selectedModuleFilter;
    return matchesSearch && matchesModule;
  });

  const modules: ServiceModule[] = ['AUTH', 'USERS', 'CONSULTATIONS', 'PAYMENTS', 'PAYOUTS', 'DASHBOARD', 'CHAT', 'ADMIN'];

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
    <aside className="sidebar-container glass-panel">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Endpoints Directory</h2>
        <span className="count-pill">{endpoints.length} Routes</span>
      </div>

      {/* Search Bar */}
      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Filter routes, paths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Module Filters Tabs */}
      <div className="module-filter-bar">
        <button
          className={`module-tab ${selectedModuleFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedModuleFilter('ALL')}
        >
          All
        </button>
        {modules.map((mod) => (
          <button
            key={mod}
            className={`module-tab ${selectedModuleFilter === mod ? 'active' : ''}`}
            onClick={() => setSelectedModuleFilter(mod)}
          >
            {MODULE_METADATA[mod].label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Endpoints List */}
      <div className="endpoint-list scrollable">
        {filteredEndpoints.length === 0 ? (
          <div className="empty-state">
            <p>No endpoints matching criteria</p>
          </div>
        ) : (
          filteredEndpoints.map((ep) => {
            const isSelected = selectedEndpoint?.id === ep.id;
            return (
              <div
                key={ep.id}
                className={`endpoint-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectEndpoint(ep)}
              >
                <div className="endpoint-card-header">
                  <span className={`method-badge ${getMethodBadgeClass(ep.method)}`}>
                    {ep.method}
                  </span>
                  <span className="module-tag">{ep.module}</span>
                </div>
                <h4 className="endpoint-name">{ep.name}</h4>
                <code className="endpoint-path">{ep.path}</code>
                {ep.requiresAuth && (
                  <span className="auth-lock-badge" title="Requires JWT Bearer Auth">
                    <Lock size={10} /> Auth
                  </span>
                )}
                <ChevronRight size={14} className="card-arrow" />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
