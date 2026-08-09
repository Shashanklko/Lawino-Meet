import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { PipelineTelemetry } from '../types/api';

const DEFAULT_BASE_URL = 'http://localhost:8080';
const TOKEN_KEY = 'lawinomeet_jwt_token';

let currentBaseUrl = localStorage.getItem('lawinomeet_base_url') || DEFAULT_BASE_URL;

export const getBaseUrl = (): string => currentBaseUrl;
export const setBaseUrl = (url: string): void => {
  currentBaseUrl = url;
  localStorage.setItem('lawinomeet_base_url', url);
};

export const getJwtToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setJwtToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent('token-updated', { detail: token }));
};

export const clearJwtToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('token-updated', { detail: null }));
};

type TelemetryListener = (telemetry: PipelineTelemetry) => void;
const listeners: Set<TelemetryListener> = new Set();

export const subscribeTelemetry = (listener: TelemetryListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emitTelemetry = (telemetry: PipelineTelemetry) => {
  listeners.forEach((listener) => listener(telemetry));
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RequestExecutionOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  pathParams?: Record<string, any>;
  body?: any;
}

export const executeApiCall = async (options: RequestExecutionOptions) => {
  const token = getJwtToken();
  const startTime = Date.now();

  let finalUrl = options.url;
  if (options.pathParams) {
    Object.entries(options.pathParams).forEach(([key, val]) => {
      finalUrl = finalUrl.replace(`{${key}}`, String(val));
    });
  }

  const fullUrl = `${currentBaseUrl}${finalUrl}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const telemetryDetails: PipelineTelemetry['details'] = {
    clientTime: startTime,
    url: fullUrl,
    method: options.method,
    jwtPresent: !!token,
    tokenSnippet: token ? `${token.substring(0, 15)}...${token.slice(-10)}` : 'None (Anonymous Request)',
    headers: requestHeaders,
    queryParams: options.queryParams,
    pathParams: options.pathParams,
    requestBody: options.body
  };

  // STEP 1: CLIENT OUTGOING
  emitTelemetry({
    stage: 'CLIENT',
    direction: 'OUTGOING',
    timestamp: Date.now(),
    activeNode: '💻 Frontend Client',
    details: { ...telemetryDetails }
  });
  await delay(250);

  // STEP 2: SECURITY FILTER
  emitTelemetry({
    stage: 'SECURITY',
    direction: 'OUTGOING',
    timestamp: Date.now(),
    activeNode: '🛡️ JWT & Security Filter',
    details: { ...telemetryDetails }
  });
  await delay(250);

  // STEP 3: CONTROLLER ROUTING
  emitTelemetry({
    stage: 'CONTROLLER',
    direction: 'OUTGOING',
    timestamp: Date.now(),
    activeNode: '⚙️ Spring REST Controller',
    details: { ...telemetryDetails }
  });
  await delay(250);

  // STEP 4: SERVICE & DATABASE LAYER
  emitTelemetry({
    stage: 'SERVICE_DB',
    direction: 'OUTGOING',
    timestamp: Date.now(),
    activeNode: '💾 Service & Database Layer',
    details: { ...telemetryDetails }
  });

  try {
    const config: AxiosRequestConfig = {
      method: options.method as any,
      url: fullUrl,
      headers: requestHeaders,
      params: options.queryParams,
      data: options.body,
      validateStatus: () => true // capture all HTTP status codes gracefully
    };

    const response: AxiosResponse = await axios(config);
    const duration = Date.now() - startTime;

    // Check if login/register response returned a token
    if (response.data && response.data.token) {
      setJwtToken(response.data.token);
    } else if (response.data && response.data.data && response.data.data.token) {
      setJwtToken(response.data.data.token);
    }

    const updatedDetails: PipelineTelemetry['details'] = {
      ...telemetryDetails,
      status: response.status,
      statusText: response.statusText || (response.status >= 200 && response.status < 300 ? 'OK' : 'Error'),
      responseTimeMs: duration,
      responseBody: response.data
    };

    // STEP 5: RETURN PATH (SERVICE -> CONTROLLER -> CLIENT)
    emitTelemetry({
      stage: 'RESPONSE_RETURN',
      direction: 'INCOMING',
      timestamp: Date.now(),
      activeNode: '↩️ Returning Response Flow',
      details: updatedDetails
    });
    await delay(300);

    const isSuccess = response.status >= 200 && response.status < 300;

    // STEP 6: COMPLETE / FINISHED
    emitTelemetry({
      stage: isSuccess ? 'COMPLETE' : 'ERROR',
      direction: 'INCOMING',
      timestamp: Date.now(),
      activeNode: isSuccess ? '✅ Delivery Complete' : '❌ Request Error',
      details: updatedDetails
    });

    return {
      status: response.status,
      data: response.data,
      durationMs: duration,
      headers: response.headers
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorDetails: PipelineTelemetry['details'] = {
      ...telemetryDetails,
      status: err.response?.status || 500,
      statusText: 'NETWORK_ERROR',
      responseTimeMs: duration,
      errorMsg: err.message || 'Could not connect to backend server. Make sure Spring Boot is running on port 8080.'
    };

    emitTelemetry({
      stage: 'ERROR',
      direction: 'INCOMING',
      timestamp: Date.now(),
      activeNode: '💥 Connection Error',
      details: errorDetails
    });

    throw {
      status: err.response?.status || 500,
      data: err.response?.data || { message: err.message || 'Network / Server Connection Error' },
      durationMs: duration
    };
  }
};
