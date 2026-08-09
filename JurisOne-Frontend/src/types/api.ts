export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ServiceModule = 
  | 'AUTH' 
  | 'USERS' 
  | 'CONSULTATIONS' 
  | 'PAYMENTS' 
  | 'PAYOUTS' 
  | 'DASHBOARD' 
  | 'CHAT' 
  | 'ADMIN';

export interface ParamDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  in: 'path' | 'query' | 'header';
  description?: string;
  defaultValue?: string | number | boolean;
}

export interface EndpointDefinition {
  id: string;
  name: string;
  module: ServiceModule;
  method: HttpMethod;
  path: string; // e.g. "/api/consultations/{id}/approve"
  description: string;
  params?: ParamDefinition[];
  sampleBody?: Record<string, any>;
  requiresAuth?: boolean;
  roleRequired?: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'ANY';
}

export type PipelineStage = 'IDLE' | 'CLIENT' | 'SECURITY' | 'CONTROLLER' | 'SERVICE_DB' | 'RESPONSE_RETURN' | 'COMPLETE' | 'ERROR';

export interface PipelineTelemetry {
  stage: PipelineStage;
  direction: 'OUTGOING' | 'INCOMING';
  timestamp: number;
  activeNode: string;
  details: {
    clientTime?: number;
    url?: string;
    method?: string;
    jwtPresent?: boolean;
    tokenSnippet?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, any>;
    pathParams?: Record<string, any>;
    requestBody?: any;
    status?: number;
    statusText?: string;
    responseTimeMs?: number;
    responseBody?: any;
    errorMsg?: string;
  };
}

export interface ApiResponseWrapper<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}
