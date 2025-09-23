/**
 * GeniSpace API 通用类型定义
 */

export interface GeniSpaceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface GeniSpacePaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * 用户相关类型
 */
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  theme?: 'light' | 'dark';
  language?: 'en' | 'zh';
  timeZone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: 'en' | 'zh';
  timeZone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * API Key 相关类型
 */
export interface ApiKey {
  id: string;
  name: string;
  application?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRevoked: boolean;
  permissions: string[];
}

export interface CreateApiKeyRequest {
  name: string;
  application?: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface GeniSpaceApiKeyResponse extends Omit<ApiKey, 'id'> {
  id: string;
  key: string; // 明文密钥，仅在创建时返回
}

/**
 * 智能体相关类型
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
  provider?: string;
  promptTemplate?: string;
  systemPrompt: string;
  agentType: 'CHAT' | 'TASK';
  conversationConfig?: Record<string, any>;
  responseConfig?: Record<string, any>;
  mcpConfig?: Record<string, any>;
  memoryConfig?: Record<string, any>;
  webSearchConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  model: string;
  systemPrompt: string;
  description?: string;
  promptTemplate?: string;
  agentType?: 'CHAT' | 'TASK';
  conversationConfig?: Record<string, any>;
  responseConfig?: Record<string, any>;
  mcpConfig?: Record<string, any>;
  memoryConfig?: Record<string, any>;
  webSearchConfig?: Record<string, any>;
}

export interface AgentExecuteRequest {
  inputs?: Record<string, any>;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
  stream?: boolean;
  session_id?: string;
}

export interface AgentChatRequest {
  contents: Array<{
    type: 'text' | 'image_url' | 'audio';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
    audio_url?: {
      url: string;
    };
  }>;
  session_id?: string;
  stream?: boolean;
  settings?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

/**
 * 任务相关类型
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  type: 'SCHEDULED' | 'EVENT' | 'MANUAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  schedule?: string;
  startDate?: string;
  endDate?: string;
  tags: string[];
  workflow?: Record<string, any>;
  metadata?: Record<string, any>;
  envVars?: Array<{
    id?: string;
    key: string;
    value: string;
    description?: string;
    isSecret?: boolean;
  }>;
  executionConfig?: Record<string, any>;
  errorHandling?: Record<string, any>;
  monitoringConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  name: string;
  type: 'SCHEDULED' | 'EVENT' | 'MANUAL';
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  schedule?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  workflow?: Record<string, any>;
  metadata?: Record<string, any>;
  envVars?: Array<{
    key: string;
    value: string;
    description?: string;
    isSecret?: boolean;
  }>;
  executionConfig?: Record<string, any>;
  errorHandling?: Record<string, any>;
  monitoringConfig?: Record<string, any>;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  userId: string;
  createdAt: string;
}

/**
 * 错误类型
 */
export class GeniSpaceError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'GeniSpaceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * SDK 配置类型
 */
export interface GeniSpaceConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
