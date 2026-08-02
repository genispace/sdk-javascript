import { BaseClient } from '../client/base';
import {
  Agent,
  CreateAgentRequest,
  AgentExecuteRequest,
  AgentChatRequest,
  AgentToolResultRequest,
  PaginationParams,
  GeniSpacePaginationResponse
} from '../types';
import { AgentJob, AgentJobEnvelope } from './agentJobs';
import {
  AgentStreamClient,
  AgentStreamEvent,
  AgentStreamRequestOptions,
  BuiltinAgentStreamRequest,
} from '../streaming';
import { GeniSpaceError } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Options for Agents.invokeAsync polling. */
export interface InvokeAsyncOptions {
  /** Poll interval in ms (default 2500). */
  pollIntervalMs?: number;
  /** Overall wall-clock budget in ms before giving up (default 600000 = 10min). */
  timeoutMs?: number;
  /** Called once with the freshly created job (202 response), before the first poll. */
  onCreated?: (job: AgentJob) => void;
  /** Called after every poll with the latest job snapshot (phase/progress). */
  onProgress?: (job: AgentJob) => void;
  /**
   * Abort signal checked on each poll iteration. On abort, polling stops and an
   * Error named 'AbortError' is thrown — the job itself keeps running server-side
   * (use agentJobs.cancel() for cooperative cancellation).
   */
  signal?: AbortSignal;
  /** Per-call model settings forwarded to the invoke (temperature, maxTokens, ...). */
  settings?: Record<string, any>;
  lang?: string;
  /** Opt-in dedupe key: identical active jobs are reused instead of re-running. */
  idempotencyKey?: string;
}

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
    /** App-provisioned agent identifier (resources.json / metadata.identifier). */
    identifier?: string;
  }): Promise<{
    data: Agent[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get('/agents', params);
  }

  /**
   * 按稳定标识符解析单个智能体（应用安装时写入的 resources.json identifier）。
   *
   * Resolve one agent by its stable identifier. The platform's `?identifier=`
   * filter matches the identifier column or `metadata.identifier` and returns
   * just that agent — exact, and unaffected by the agents-list `limit<=100` cap.
   * Prefer this over `list({ search })`, which only matches name/description and
   * can never resolve an agent by identifier.
   *
   * @returns the matching agent, or `null` when none is provisioned in the space.
   */
  async getByIdentifier(identifier: string): Promise<Agent | null> {
    const res = await this.list({ identifier, limit: 5 });
    const rows = res.data ?? [];
    return rows.find((a) => a.identifier === identifier || a.metadata?.identifier === identifier) ?? null;
  }

  /**
   * 异步执行智能体任务（AGENT_INVOKE 后台任务）。
   *
   * Enqueues an AGENT_INVOKE job (POST /agent-jobs), polls GET /agent-jobs/:id
   * until it reaches a terminal state, and returns `job.result` — the same
   * response body the synchronous `execute()` returns. Prefer this for
   * minute-scale TASK invokes so no HTTP request is held open.
   *
   * @param idOrIdentifier agent UUID, or the installed-app identifier
   *   (metadata.identifier) when not a UUID.
   * @throws Error with `.job` attached when the job FAILED / CANCELLED or the
   *   polling budget is exhausted. A 404 on POST /agent-jobs means the platform
   *   predates this endpoint (callers may fall back to `execute()`).
   */
  async invokeAsync(
    idOrIdentifier: string,
    inputs: Record<string, any>,
    opts: InvokeAsyncOptions = {}
  ): Promise<any> {
    const {
      pollIntervalMs = 2500,
      timeoutMs = 600000,
      onCreated,
      onProgress,
      signal,
      settings,
      lang,
      idempotencyKey,
    } = opts;

    const notify = (handler: ((job: AgentJob) => void) | undefined, current: AgentJob) => {
      if (!handler) return;
      try { handler(current); } catch { /* observer errors must not kill polling */ }
    };

    const payload: Record<string, any> = { inputs };
    if (UUID_RE.test(idOrIdentifier)) payload.agentId = idOrIdentifier;
    else payload.agentIdentifier = idOrIdentifier;
    if (settings) payload.settings = settings;
    if (lang) payload.lang = lang;
    if (idempotencyKey) payload.idempotencyKey = idempotencyKey;

    const created: AgentJobEnvelope = await this.post('/agent-jobs', {
      type: 'AGENT_INVOKE',
      payload,
    });
    let job: AgentJob = created?.data ?? (created as any);
    if (!job?.id) {
      throw new Error('agent-jobs: unexpected create response');
    }

    notify(onCreated, job);

    const deadline = Date.now() + timeoutMs;
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const throwIfAborted = () => {
      if (signal?.aborted) {
        // The job keeps running server-side; we only stop observing it.
        const err = new Error('Aborted');
        err.name = 'AbortError';
        (err as any).job = job;
        throw err;
      }
    };

    for (;;) {
      throwIfAborted();
      if (job.status === 'SUCCEEDED') return job.result;
      if (job.status === 'FAILED' || job.status === 'CANCELLED') {
        const err = new Error(job.error || `Agent job ${job.status.toLowerCase()}`);
        (err as any).job = job;
        throw err;
      }
      if (Date.now() >= deadline) {
        const err = new Error(`Agent job timed out after ${timeoutMs}ms`);
        (err as any).job = job;
        throw err;
      }
      await sleep(pollIntervalMs);
      throwIfAborted();
      const polled: AgentJobEnvelope = await this.get(`/agent-jobs/${job.id}`);
      job = polled?.data ?? (polled as any);
      notify(onProgress, job);
    }
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
    if (data.stream === true) {
      throw new GeniSpaceError(
        'agents.chat() is non-streaming; use agents.chatStream() for LangGraph V3 streams',
        'AGENT_STREAM_METHOD_REQUIRED'
      );
    }
    return this.post(`/agents/${agentId}/chat`, data);
  }

  /** Stream a conversational agent using the platform LangGraph V3 contract. */
  chatStream(
    agentId: string,
    data: AgentChatRequest,
    options?: AgentStreamRequestOptions
  ): AsyncGenerator<AgentStreamEvent> {
    return new AgentStreamClient(this.config).chat(agentId, data, options);
  }

  /** Stream a code-defined CHAT built-in such as knowledge_copilot. */
  builtinStream(
    agentId: string,
    data: BuiltinAgentStreamRequest,
    options?: AgentStreamRequestOptions
  ): AsyncGenerator<AgentStreamEvent> {
    return new AgentStreamClient(this.config).builtin(agentId, data, options);
  }

  /** Resume an interrupted local-tool call with its client-side result. */
  async submitToolResult(agentId: string, data: AgentToolResultRequest): Promise<any> {
    return this.post(`/agents/${encodeURIComponent(agentId)}/tool-result`, data);
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
    spaceId: string;
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
    spaceId?: string;
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
