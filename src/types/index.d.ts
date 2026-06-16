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
    key: string;
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
 * 工作台（Workbench）
 */
export type WorkbenchStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export interface Workbench {
    id: string;
    name: string;
    description?: string;
    config: Record<string, unknown>;
    spaceId: string;
    version: string | number;
    status: WorkbenchStatus;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface UpdateWorkbenchRequest {
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
    status?: WorkbenchStatus;
    isActive?: boolean;
}
export interface WorkbenchVersion {
    id: string;
    version: string;
    createdAt: string;
    createdBy: string;
    description?: string;
    changes?: string;
    config?: Record<string, unknown>;
}
/** 工作台概览中的数据源引用类型 */
export type WorkbenchOverviewDataSourceType = 'dataset' | 'database-datasource';
/** 工作台概览中的数据源摘要 */
export interface WorkbenchOverviewDataSource {
    type: WorkbenchOverviewDataSourceType;
    id: string;
    name?: string;
}
/** 工作台概览中的组件操作摘要 */
export interface WorkbenchOverviewAction {
    id?: string;
    label?: string;
    position?: string;
    operationType: string;
    dataSource: WorkbenchOverviewDataSource | WorkbenchOverviewDataSource[];
}
/** 工作台概览中的组件树节点 */
export interface WorkbenchOverviewComponent {
    id: string;
    type: string;
    title?: string;
    dataSource?: WorkbenchOverviewDataSource;
    dataSources?: WorkbenchOverviewDataSource[];
    actions?: WorkbenchOverviewAction[];
    children?: WorkbenchOverviewComponent[];
}
/** 工作台概览中的页面摘要 */
export interface WorkbenchOverviewPage {
    key: string;
    title: string;
    description?: string;
    components: WorkbenchOverviewComponent[];
}
/** 工作台概览中的导航树节点 */
export interface WorkbenchOverviewNavigationItem {
    key: string;
    title: string;
    path?: string;
    page?: WorkbenchOverviewPage;
    children?: WorkbenchOverviewNavigationItem[];
}
/**
 * 工作台概览（树形结构，不含完整 config，供第三方客户端如移动端壳使用）
 */
export interface WorkbenchOverview {
    id: string;
    name: string;
    description?: string;
    status: WorkbenchStatus;
    navigation: WorkbenchOverviewNavigationItem[];
    unlinkedPages?: WorkbenchOverviewPage[];
}
/**
 * 错误类型
 */
export declare class GeniSpaceError extends Error {
    readonly code?: string;
    readonly statusCode?: number;
    constructor(message: string, code?: string, statusCode?: number);
}
/**
 * SDK 配置类型
 */
export interface GeniSpaceConfig {
    /** API Key (Bearer). Used when `accessToken` is unset. */
    apiKey: string;
    /** Optional OAuth / session token; takes precedence over `apiKey` when set (e.g. browser GeniApps). */
    accessToken?: string;
    baseURL?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
