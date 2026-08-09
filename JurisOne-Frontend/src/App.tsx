import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from './services/apiEndpoints';
import type { EndpointDefinition, PipelineTelemetry } from './types/api';
import { subscribeTelemetry, executeApiCall } from './services/apiClient';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ApiPipelineVisualizer } from './components/ApiPipelineVisualizer';
import { PresetsBanner } from './components/PresetsBanner';
import { EndpointTester } from './components/EndpointTester';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition>(ENDPOINTS[0]);
  const [telemetry, setTelemetry] = useState<PipelineTelemetry | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

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

  // 🚀 1-Click Automated Database Seeding & Full Test Suite Runner
  const handleRunAutoSeeding = async () => {
    setIsSeeding(true);
    try {
      // 1. Register Client User
      await executeApiCall({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          name: 'John Doe (Client)',
          email: 'client.test@jurisone.com',
          password: 'Password123!',
          role: 'CLIENT',
          phone: '+1234567890'
        }
      });

      // 2. Register Lawyer User
      await executeApiCall({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          name: 'Jane Smith (Lawyer)',
          email: 'lawyer.jane@jurisone.com',
          password: 'Password123!',
          role: 'LAWYER',
          phone: '+9876543210',
          specialization: 'Corporate Law',
          fee: 150.00
        }
      });

      // 3. Login as Client to obtain JWT Token
      await executeApiCall({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'client.test@jurisone.com',
          password: 'Password123!'
        }
      });

      // 4. Submit Consultation Request
      await executeApiCall({
        method: 'POST',
        url: '/api/consultations/request',
        body: {
          clientId: 1,
          lawyerId: 2,
          type: 'ONLINE',
          notes: 'Contract review request seeded automatically.'
        }
      });

      // 5. Approve Consultation & Set Fee ($150)
      await executeApiCall({
        method: 'POST',
        url: '/api/consultations/1/approve',
        queryParams: { customFee: 150.00 }
      });

      // 6. Process Payment Checkout
      await executeApiCall({
        method: 'POST',
        url: '/api/payments/checkout/1'
      });

      // 7. Request Lawyer Earnings Payout ($100)
      await executeApiCall({
        method: 'POST',
        url: '/api/payouts/request',
        queryParams: { lawyerId: 2, amount: 100.00, bankDetails: 'IBAN: US99123456' }
      });

      // 8. Fetch Admin Dashboard Metrics
      await executeApiCall({
        method: 'GET',
        url: '/api/dashboard/admin'
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Seeding encountered an expected step error:', e);
    } finally {
      setIsSeeding(false);
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

        {/* Right Workspace: Pipeline Visualizer + Endpoint Execution Workspace */}
        <main className="workspace-container">
          {/* Quick Presets & 1-Click Database Seeder */}
          <PresetsBanner
            endpoints={ENDPOINTS}
            onSelectPreset={handleSelectPreset}
            onRunAutoSeeding={handleRunAutoSeeding}
            isSeeding={isSeeding}
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
