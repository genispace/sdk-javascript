import { BaseClient } from '../client/base';

/** Terminal + in-flight states of a background agent job. */
export type AgentJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/** Client-facing job DTO returned by /agent-jobs endpoints. */
export interface AgentJob {
  id: string;
  type?: string;
  status: AgentJobStatus;
  phase?: string | null;
  progress?: { done: number; total: number };
  /** Handler output; for AGENT_INVOKE this is the agent worker's parsed response body. */
  result?: any;
  error?: string | null;
  cancelRequested?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Body for POST /agent-jobs. Only whitelisted generic types are accepted. */
export interface CreateAgentJobRequest {
  type: 'AGENT_INVOKE';
  payload: {
    /** Target agent UUID (mutually optional with agentIdentifier; one is required). */
    agentId?: string;
    /** Installed-app resources.json identifier (metadata.identifier). */
    agentIdentifier?: string;
    inputs: Record<string, any>;
    /** Per-call model settings (temperature, maxTokens, ...). */
    settings?: Record<string, any>;
    lang?: string;
    /** Opt-in dedupe: identical active jobs with the same key are reused. */
    idempotencyKey?: string;
  };
}

export interface AgentJobEnvelope {
  success?: boolean;
  data: AgentJob;
}

/**
 * 通用异步任务（Agent Job）资源：创建 / 轮询 / 取消。
 * Generic async job resource for POST /agent-jobs (202 + job), GET /agent-jobs/:id
 * polling, and cooperative cancellation.
 */
export class AgentJobs extends BaseClient {

  /** 创建异步任务（如 AGENT_INVOKE）。Returns 202 with the created job. */
  async create(body: CreateAgentJobRequest): Promise<AgentJobEnvelope> {
    return this.post('/agent-jobs', body);
  }

  /** 轮询任务状态 GET /agent-jobs/:id */
  async getJob(id: string): Promise<AgentJobEnvelope> {
    return this.get(`/agent-jobs/${id}`);
  }

  /** 请求协作取消 POST /agent-jobs/:id/cancel */
  async cancel(id: string): Promise<AgentJobEnvelope> {
    return this.post(`/agent-jobs/${id}/cancel`);
  }
}
