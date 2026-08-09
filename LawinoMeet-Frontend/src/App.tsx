import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from './services/apiEndpoints';
import type { EndpointDefinition, PipelineTelemetry } from './types/api';
import { subscribeTelemetry, executeApiCall } from './services/apiClient';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ApiPipelineVisualizer } from './components/ApiPipelineVisualizer';
import { PresetsBanner } from './components/PresetsBanner';
import type { SeedStep } from './components/PresetsBanner';
import { EndpointTester } from './components/EndpointTester';
import { SeedReport } from './components/SeedReport';
import type { SeedResultEntry } from './components/SeedReport';
import { TestReport } from './components/TestReport';
import type { TestCaseResult } from './components/TestReport';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition>(ENDPOINTS[0]);
  const [telemetry, setTelemetry] = useState<PipelineTelemetry | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [seedSteps, setSeedSteps] = useState<SeedStep[]>([]);

  // Report state
  const [showSeedReport, setShowSeedReport] = useState(false);
  const [seedResults, setSeedResults] = useState<SeedResultEntry[]>([]);
  const [showTestReport, setShowTestReport] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeTelemetry((t) => setTelemetry(t));
    return () => unsubscribe();
  }, []);

  const handleResetPipeline = () => setTelemetry(null);

  const handleSelectPreset = (endpointId: string, customParams?: Record<string, any>, customBody?: any) => {
    const target = ENDPOINTS.find((ep) => ep.id === endpointId);
    if (target) {
      const cloned = { ...target };
      if (customParams) {
        cloned.params = cloned.params?.map((p) =>
          customParams[p.name] !== undefined ? { ...p, defaultValue: customParams[p.name] } : p
        );
      }
      if (customBody) cloned.sampleBody = customBody;
      setSelectedEndpoint(cloned);
    }
  };

  // ─── Step state helpers ──────────────────────────────────────────────────
  const markStep = (steps: SeedStep[], index: number, status: SeedStep['status']): SeedStep[] => {
    const updated = [...steps];
    updated[index] = { ...updated[index], status };
    return updated;
  };

  // ─── 🌱 SEED DATABASE ────────────────────────────────────────────────────
  const SEED_DEFINITIONS = [
    {
      label: 'Register Client',
      method: 'POST', url: '/api/auth/register',
      body: { firstname: 'John', lastname: 'Doe', email: 'client.test@lawinomeet.com', password: 'Password123!', role: 'CLIENT' }
    },
    {
      label: 'Register Lawyer',
      method: 'POST', url: '/api/auth/register',
      body: { firstname: 'Jane', lastname: 'Smith', email: 'lawyer.jane@lawinomeet.com', password: 'Password123!', role: 'LAWYER' }
    },
    {
      label: 'Login & Get JWT',
      method: 'POST', url: '/api/auth/login',
      body: { email: 'client.test@lawinomeet.com', password: 'Password123!' }
    },
    {
      label: 'Consultation 1 — Request',
      method: 'POST', url: '/api/consultations/request',
      body: {
        clientId: 1, lawyerId: 2,
        clientName: 'John Doe', clientEmail: 'client.test@lawinomeet.com',
        clientPhoneNumber: '+1234567890', location: 'Mumbai, India',
        query: 'Contract review for property purchase — urgent legal advice needed.',
        mode: 'ONLINE_VIDEO', requestedTimeSlot: '2026-09-15T10:00:00'
      }
    },
    {
      label: 'Consultation 1 — Approve ($150)',
      method: 'POST', url: '/api/consultations/1/approve',
      params: { customFee: 150.00 }
    },
    {
      label: 'Payment Checkout',
      method: 'POST', url: '/api/payments/checkout/1'
    },
    {
      label: 'Payout Request ($100)',
      method: 'POST', url: '/api/payouts/request',
      params: { lawyerId: 2, amount: 100.00, bankDetails: 'IBAN: US99123456' }
    },
    {
      label: 'Consultation 2 — PENDING Request',
      method: 'POST', url: '/api/consultations/request',
      body: {
        clientId: 1, lawyerId: 2,
        clientName: 'John Doe', clientEmail: 'client.test@lawinomeet.com',
        clientPhoneNumber: '+1234567890', location: 'Delhi, India',
        query: 'Employment contract dispute — awaiting lawyer approval.',
        mode: 'OFFLINE_OFFICE', requestedTimeSlot: '2026-09-20T14:00:00'
      }
    },
  ];

  const handleRunSeedDatabase = async () => {
    const steps: SeedStep[] = SEED_DEFINITIONS.map((d) => ({ label: d.label, status: 'idle' }));
    setSeedSteps(steps);
    setIsSeeding(true);
    setSeedResults([]);
    setShowSeedReport(false);

    const collected: SeedResultEntry[] = [];

    for (let i = 0; i < SEED_DEFINITIONS.length; i++) {
      const def = SEED_DEFINITIONS[i];
      setSeedSteps((prev) => markStep(prev, i, 'running'));

      try {
        const res = await executeApiCall({
          method: def.method,
          url: def.url,
          body: (def as any).body,
          queryParams: (def as any).params,
        });
        setSeedSteps((prev) => markStep(prev, i, 'done'));
        collected.push({
          step: def.label,
          icon: '',
          method: def.method,
          url: def.url,
          requestBody: (def as any).body,
          requestParams: (def as any).params,
          responseStatus: res.status,
          responseData: res.data,
          durationMs: res.durationMs,
          passed: res.status >= 200 && res.status < 300,
        });
      } catch (err: any) {
        setSeedSteps((prev) => markStep(prev, i, 'error'));
        collected.push({
          step: def.label,
          icon: '',
          method: def.method,
          url: def.url,
          requestBody: (def as any).body,
          requestParams: (def as any).params,
          responseStatus: err.status || 500,
          responseData: err.data,
          durationMs: err.durationMs,
          passed: false,
          errorMsg: err.data?.message || 'Network / server error',
        });
      }
    }

    setSeedResults(collected);
    setIsSeeding(false);
    setShowSeedReport(true);

    const allPassed = collected.every((r) => r.passed);
    if (allPassed) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    }
  };

  // ─── 🧪 TEST ALL SUITE ───────────────────────────────────────────────────
  const TEST_DEFINITIONS: { name: string; method: string; url: string; body?: any; params?: any; expectStatus?: number }[] = [
    { name: 'Register New User',            method: 'POST', url: '/api/auth/register',
      body: { firstname: 'Test', lastname: 'User', email: 'testrun@lawinomeet.com', password: 'Password123!', role: 'CLIENT' } },
    { name: 'Login & Capture JWT',          method: 'POST', url: '/api/auth/login',
      body: { email: 'client.test@lawinomeet.com', password: 'Password123!' } },
    { name: 'Get All Users',                method: 'GET',  url: '/api/users' },
    { name: 'Get Client Consultations',     method: 'GET',  url: '/api/consultations/client/1' },
    { name: 'Get Lawyer Inbox',             method: 'GET',  url: '/api/consultations/lawyer-inbox/2' },
    { name: 'Get Consultation by ID',       method: 'GET',  url: '/api/consultations/1' },
    { name: 'Client Dashboard Metrics',     method: 'GET',  url: '/api/dashboard/client/1' },
    { name: 'Lawyer Dashboard Metrics',     method: 'GET',  url: '/api/dashboard/lawyer/2' },
    { name: 'Admin Dashboard Metrics',      method: 'GET',  url: '/api/dashboard/admin' },
    { name: 'Lawyer Wallet Breakdown',      method: 'GET',  url: '/api/payouts/wallet/2' },
    { name: 'Lawyer Payout History',        method: 'GET',  url: '/api/payouts/lawyer/2' },
    { name: 'All Dispute Tickets',          method: 'GET',  url: '/api/admin/disputes' },
    { name: 'Pending Admin Payouts',        method: 'GET',  url: '/api/admin/payouts/pending' },
  ];

  const handleRunTestSuite = async () => {
    setIsTesting(true);
    setShowTestReport(false);
    setTestResults([]);

    const collected: TestCaseResult[] = [];

    for (const def of TEST_DEFINITIONS) {
      try {
        const res = await executeApiCall({
          method: def.method,
          url: def.url,
          body: def.body,
          queryParams: def.params,
        });
        const passed = res.status >= 200 && res.status < 300;
        collected.push({
          name: def.name,
          method: def.method,
          url: def.url,
          requestBody: def.body,
          requestParams: def.params,
          responseStatus: res.status,
          responseData: res.data,
          durationMs: res.durationMs,
          passed,
          failReason: !passed ? `Expected 2xx but got ${res.status}` : undefined,
        });
      } catch (err: any) {
        collected.push({
          name: def.name,
          method: def.method,
          url: def.url,
          requestBody: def.body,
          requestParams: def.params,
          responseStatus: err.status || 500,
          responseData: err.data,
          durationMs: err.durationMs,
          passed: false,
          failReason: err.data?.message || 'Network / server error',
        });
      }
    }

    setTestResults(collected);
    setIsTesting(false);
    setShowTestReport(true);

    const allPassed = collected.every((r) => r.passed);
    if (allPassed) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="app-container">
      <Header onResetPipeline={handleResetPipeline} />

      <div className="main-layout">
        <Sidebar
          endpoints={ENDPOINTS}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={(ep) => setSelectedEndpoint(ep)}
        />

        <main className="workspace-container">
          <PresetsBanner
            endpoints={ENDPOINTS}
            onSelectPreset={handleSelectPreset}
            onRunSeedDatabase={handleRunSeedDatabase}
            onRunTestSuite={handleRunTestSuite}
            isSeeding={isSeeding}
            isTesting={isTesting}
            seedSteps={seedSteps}
          />

          <ApiPipelineVisualizer telemetry={telemetry} />
          <EndpointTester endpoint={selectedEndpoint} />
        </main>
      </div>

      {/* 🌱 Seed Database Results Report */}
      {showSeedReport && (
        <SeedReport results={seedResults} onClose={() => setShowSeedReport(false)} />
      )}

      {/* 🧪 Test Suite Results Report */}
      {showTestReport && (
        <TestReport results={testResults} onClose={() => setShowTestReport(false)} />
      )}
    </div>
  );
};

export default App;
