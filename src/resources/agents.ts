import { BaseClient } from '../client/base';
import { 
  Agent, 
  CreateAgentRequest, 
  AgentExecuteRequest, 
  AgentChatRequest,
  PaginationParams,
  GeniSpacePaginationResponse 
} from '../types';

/**
 * 智能体管理资源
 */
export class Agents extends BaseClient {
  
  /**
   * 获取智能体列表
   */
  async list(params?: PaginationParams & {
    agentType?: 'CHAT' | 'TASK';
    search?: string;
  }): Promise<{
    data: Agent[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get('/agents', params);
  }

  /**
   * 创建智能体
   */
  async create(data: CreateAgentRequest): Promise<Agent> {
    return this.post<Agent>('/agents', data);
  }

  /**
   * 获取智能体详情
   */
  async getAgent(agentId: string): Promise<Agent> {
    return this.get<Agent>(`/agents/${agentId}`);
  }

  /**
   * 删除智能体
   */
  async deleteAgent(agentId: string): Promise<void> {
    return this.delete(`/agents/${agentId}`);
  }

  /**
   * 智能体任务执行
   */
  async execute(agentId: string, data: AgentExecuteRequest): Promise<any> {
    return this.post(`/agents/${agentId}/execute`, data);
  }

  /**
   * 智能体聊天对话
   */
  async chat(agentId: string, data: AgentChatRequest): Promise<any> {
    return this.post(`/agents/${agentId}/chat`, data);
  }

  /**
   * 获取智能体绑定的MCP工具列表
   */
  async getMcpTools(agentId: string): Promise<{
    tools: any[];
    operatorTools: any[];
    taskTools: any[];
    externalTools: any[];
  }> {
    return this.get(`/agents/${agentId}/mcp/tools`);
  }

  /**
   * 创建智能体会话
   */
  async createSession(data: {
    userAgentId?: string;
    title?: string;
    metadata?: Record<string, any>;
    sessionType?: 'chat' | 'test' | 'task' | 'assistant';
  }): Promise<{
    sessionId: string;
    agentId: string;
    userId: string;
    teamId: string;
    title: string;
    status: string;
    createdAt: string;
  }> {
    return this.post('/agents/sessions', data);
  }

  /**
   * 获取用户的智能体会话列表
   */
  async getSessions(params?: PaginationParams & {
    teamId?: string;
    userAgentId?: string;
    agentType?: 'CHAT' | 'ASSISTANT';
    status?: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: any[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get('/agents/sessions', params);
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<any> {
    return this.get(`/agents/sessions/${sessionId}`);
  }

  /**
   * 更新会话信息
   */
  async updateSession(sessionId: string, data: {
    title?: string;
    metadata?: Record<string, any>;
    status?: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  }): Promise<any> {
    return this.patch(`/agents/sessions/${sessionId}`, data);
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.delete(`/agents/sessions/${sessionId}`);
  }

  /**
   * 获取会话消息列表
   */
  async getSessionMessages(sessionId: string, params?: PaginationParams): Promise<{
    data: any[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get(`/agents/sessions/${sessionId}/messages`, params);
  }

  /**
   * 删除会话中的所有消息
   */
  async deleteSessionMessages(sessionId: string): Promise<{
    message: string;
    deletedCount: number;
  }> {
    return this.delete(`/agents/sessions/${sessionId}/messages`);
  }

  // 智能体记忆管理
  
  /**
   * 获取智能体记忆列表
   */
  async getMemory(agentId: string, params?: PaginationParams & {
    search?: string;
    memory_type?: string;
    isolation_level?: 'all' | 'session' | 'user' | 'agent';
    session_id?: string;
  }): Promise<{
    data: any[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get(`/agents/${agentId}/memory`, params);
  }

  /**
   * 手动创建记忆
   */
  async createMemory(agentId: string, data: {
    content: string;
    importance_score?: number;
    memory_type?: string;
    tags?: string[];
    session_id?: string;
    original_context?: string;
    auto_layer?: boolean;
    target_layers?: string[];
    user_id?: string;
  }): Promise<any> {
    return this.post(`/agents/${agentId}/memory`, data);
  }

  /**
   * 更新记忆
   */
  async updateMemory(agentId: string, memoryId: string, data: {
    content?: string;
    importance_score?: number;
    tags?: string[];
  }): Promise<any> {
    return this.put(`/agents/${agentId}/memory/${memoryId}`, data);
  }

  /**
   * 删除记忆
   */
  async deleteMemory(agentId: string, memoryId: string): Promise<void> {
    return this.delete(`/agents/${agentId}/memory/${memoryId}`);
  }

  /**
   * 搜索记忆
   */
  async searchMemory(agentId: string, data: {
    query: string;
    limit?: number;
    isolation_levels?: string[];
    session_id?: string;
    memory_types?: string[];
    importance_threshold?: number;
  }): Promise<any> {
    return this.post(`/agents/${agentId}/memory/search`, data);
  }

  /**
   * 清除会话记忆
   */
  async clearSessionMemory(agentId: string, sessionId: string, data?: {
    isolation_level?: 'session' | 'user' | 'agent';
  }): Promise<void> {
    return this.delete(`/agents/${agentId}/memory/session/${sessionId}`, { data });
  }

  /**
   * 清除智能体记忆
   */
  async clearMemory(agentId: string, data?: {
    isolation_level?: 'agent' | 'session' | 'user';
  }): Promise<void> {
    return this.delete(`/agents/${agentId}/memory/clear`, { data });
  }
}
