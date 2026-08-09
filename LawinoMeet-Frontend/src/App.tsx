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
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition>(ENDPOINTS[0]);
  const [telemetry, setTelemetry] = useState<PipelineTelemetry | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [seedSteps, setSeedSteps] = useState<SeedStep[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeTelemetry((t) => {
      setTelemetry(t);
    });
    return () => unsubscribe();
  }, []);

  const handleResetPipeline = () => setTelemetry(null);

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
      if (customBody) cloned.sampleBody = customBody;
      setSelectedEndpoint(cloned);
    }
  };

  // ─── Helper: update a seed step status ────────────────────────────────────
  const markStep = (steps: SeedStep[], index: number, status: SeedStep['status']): SeedStep[] => {
    const updated = [...steps];
    updated[index] = { ...updated[index], status };
    return updated;
  };

  // ─── 🌱 SEED DATABASE ─────────────────────────────────────────────────────
  // Creates realistic data:
  //   - 1 Client user
  //   - 1 Lawyer user
  //   - 1 APPROVED consultation (payment done, payout requested)
  //   - 1 PENDING consultation (awaiting lawyer approval — always left pending)
  const handleRunSeedDatabase = async () => {
    const steps: SeedStep[] = [
      { label: 'Register Client',                  status: 'idle' },
      { label: 'Register Lawyer',                  status: 'idle' },
      { label: 'Login & Get JWT',                  status: 'idle' },
      { label: 'Consultation 1 — Request',         status: 'idle' },
      { label: 'Consultation 1 — Approve ($150)',  status: 'idle' },
      { label: 'Payment Checkout',                 status: 'idle' },
      { label: 'Payout Request ($100)',             status: 'idle' },
      { label: 'Consultation 2 — PENDING Request', status: 'idle' },
    ];
    setSeedSteps(steps);
    setIsSeeding(true);

    const run = async (index: number, fn: () => Promise<any>) => {
      setSeedSteps((prev) => markStep(prev, index, 'running'));
      try {
        await fn();
        setSeedSteps((prev) => markStep(prev, index, 'done'));
      } catch {
        setSeedSteps((prev) => markStep(prev, index, 'error'));
      }
    };

    try {
      // 1. Register Client
      await run(0, () => executeApiCall({
        method: 'POST', url: '/api/auth/register',
        body: { firstname: 'John', lastname: 'Doe', email: 'client.test@lawinomeet.com', password: 'Password123!', role: 'CLIENT' }
      }));

      // 2. Register Lawyer
      await run(1, () => executeApiCall({
        method: 'POST', url: '/api/auth/register',
        body: { firstname: 'Jane', lastname: 'Smith', email: 'lawyer.jane@lawinomeet.com', password: 'Password123!', role: 'LAWYER' }
      }));

      // 3. Login → JWT auto-captured
      await run(2, () => executeApiCall({
        method: 'POST', url: '/api/auth/login',
        body: { email: 'client.test@lawinomeet.com', password: 'Password123!' }
      }));

      // 4. Consultation 1 — Request (will be approved)
      await run(3, () => executeApiCall({
        method: 'POST', url: '/api/consultations/request',
        body: {
          clientId: 1, lawyerId: 2,
          clientName: 'John Doe', clientEmail: 'client.test@lawinomeet.com',
          clientPhoneNumber: '+1234567890', location: 'Mumbai, India',
          query: 'Contract review for property purchase — need urgent legal advice.',
          mode: 'ONLINE_VIDEO', requestedTimeSlot: '2026-09-15T10:00:00'
        }
      }));

      // 5. Approve Consultation 1 + Set fee
      await run(4, () => executeApiCall({
        method: 'POST', url: '/api/consultations/1/approve',
        queryParams: { customFee: 150.00 }
      }));

      // 6. Payment Checkout for Consultation 1
      await run(5, () => executeApiCall({ method: 'POST', url: '/api/payments/checkout/1' }));

      // 7. Lawyer Payout Request
      await run(6, () => executeApiCall({
        method: 'POST', url: '/api/payouts/request',
        queryParams: { lawyerId: 2, amount: 100.00, bankDetails: 'IBAN: US99123456' }
      }));

      // 8. Consultation 2 — PENDING (intentionally NOT approved, left for manual testing)
      await run(7, () => executeApiCall({
        method: 'POST', url: '/api/consultations/request',
        body: {
          clientId: 1, lawyerId: 2,
          clientName: 'John Doe', clientEmail: 'client.test@lawinomeet.com',
          clientPhoneNumber: '+1234567890', location: 'Delhi, India',
          query: 'Employment contract dispute — awaiting lawyer approval.',
          mode: 'OFFLINE_OFFICE', requestedTimeSlot: '2026-09-20T14:00:00'
        }
      }));

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } catch (e) {
      console.log('Seed error:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  // ─── 🧪 TEST ALL SUITE ────────────────────────────────────────────────────
  // Runs the full API workflow end-to-end: register → login → consult → pay → payout → admin
  const handleRunTestSuite = async () => {
    setIsTesting(true);
    try {
      await executeApiCall({ method: 'POST', url: '/api/auth/register',
        body: { firstname: 'Test', lastname: 'User', email: 'testrun@lawinomeet.com', password: 'Password123!', role: 'CLIENT' }
      });
      await executeApiCall({ method: 'POST', url: '/api/auth/login',
        body: { email: 'client.test@lawinomeet.com', password: 'Password123!' }
      });
      await executeApiCall({ method: 'GET', url: '/api/users' });
      await executeApiCall({ method: 'GET', url: '/api/consultations/client/1' });
      await executeApiCall({ method: 'GET', url: '/api/consultations/lawyer-inbox/2' });
      await executeApiCall({ method: 'GET', url: '/api/dashboard/client/1' });
      await executeApiCall({ method: 'GET', url: '/api/dashboard/lawyer/2' });
      await executeApiCall({ method: 'GET', url: '/api/dashboard/admin' });
      await executeApiCall({ method: 'GET', url: '/api/payouts/wallet/2' });
      await executeApiCall({ method: 'GET', url: '/api/payouts/lawyer/2' });
      await executeApiCall({ method: 'GET', url: '/api/admin/disputes' });
      await executeApiCall({ method: 'GET', url: '/api/admin/payouts/pending' });

      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    } catch (e) {
      console.log('Test suite error:', e);
    } finally {
      setIsTesting(false);
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
    </div>
  );
};

export default App;
