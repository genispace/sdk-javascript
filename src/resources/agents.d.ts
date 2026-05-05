import { BaseClient } from '../client/base';
import { Agent, CreateAgentRequest, AgentExecuteRequest, AgentChatRequest, PaginationParams, GeniSpacePaginationResponse } from '../types';
/**
 * 智能体管理资源
 */
export declare class Agents extends BaseClient {
    /**
     * 获取智能体列表
     */
    list(params?: PaginationParams & {
        agentType?: 'CHAT' | 'TASK';
        search?: string;
    }): Promise<{
        data: Agent[];
        pagination: GeniSpacePaginationResponse;
    }>;
    /**
     * 创建智能体
     */
    create(data: CreateAgentRequest): Promise<Agent>;
    /**
     * 获取智能体详情
     */
    getAgent(agentId: string): Promise<Agent>;
    /**
     * 删除智能体
     */
    deleteAgent(agentId: string): Promise<void>;
    /**
     * 智能体任务执行
     */
    execute(agentId: string, data: AgentExecuteRequest): Promise<any>;
    /**
     * 智能体聊天对话
     */
    chat(agentId: string, data: AgentChatRequest): Promise<any>;
    /**
     * 获取智能体绑定的MCP工具列表
     */
    getMcpTools(agentId: string): Promise<{
        tools: any[];
        operatorTools: any[];
        taskTools: any[];
        externalTools: any[];
    }>;
    /**
     * 创建智能体会话
     */
    createSession(data: {
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
    }>;
    /**
     * 获取用户的智能体会话列表
     */
    getSessions(params?: PaginationParams & {
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
    }>;
    /**
     * 获取会话详情
     */
    getSession(sessionId: string): Promise<any>;
    /**
     * 更新会话信息
     */
    updateSession(sessionId: string, data: {
        title?: string;
        metadata?: Record<string, any>;
        status?: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    }): Promise<any>;
    /**
     * 删除会话
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * 获取会话消息列表
     */
    getSessionMessages(sessionId: string, params?: PaginationParams): Promise<{
        data: any[];
        pagination: GeniSpacePaginationResponse;
    }>;
    /**
     * 删除会话中的所有消息
     */
    deleteSessionMessages(sessionId: string): Promise<{
        message: string;
        deletedCount: number;
    }>;
    /**
     * 获取智能体记忆列表
     */
    getMemory(agentId: string, params?: PaginationParams & {
        search?: string;
        memory_type?: string;
        isolation_level?: 'all' | 'session' | 'user' | 'agent';
        session_id?: string;
    }): Promise<{
        data: any[];
        pagination: GeniSpacePaginationResponse;
    }>;
    /**
     * 手动创建记忆
     */
    createMemory(agentId: string, data: {
        content: string;
        importance_score?: number;
        memory_type?: string;
        tags?: string[];
        session_id?: string;
        original_context?: string;
        auto_layer?: boolean;
        target_layers?: string[];
        user_id?: string;
    }): Promise<any>;
    /**
     * 更新记忆
     */
    updateMemory(agentId: string, memoryId: string, data: {
        content?: string;
        importance_score?: number;
        tags?: string[];
    }): Promise<any>;
    /**
     * 删除记忆
     */
    deleteMemory(agentId: string, memoryId: string): Promise<void>;
    /**
     * 搜索记忆
     */
    searchMemory(agentId: string, data: {
        query: string;
        limit?: number;
        isolation_levels?: string[];
        session_id?: string;
        memory_types?: string[];
        importance_threshold?: number;
    }): Promise<any>;
    /**
     * 清除会话记忆
     */
    clearSessionMemory(agentId: string, sessionId: string, data?: {
        isolation_level?: 'session' | 'user' | 'agent';
    }): Promise<void>;
    /**
     * 清除智能体记忆
     */
    clearMemory(agentId: string, data?: {
        isolation_level?: 'agent' | 'session' | 'user';
    }): Promise<void>;
}
