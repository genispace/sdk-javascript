export const AGENT_STREAM_PROTOCOL = 'langgraph-v3';

export interface AgentProtocolEventV3 {
  type: 'event';
  method: string;
  params: Record<string, unknown>;
  seq: number;
}

export interface AgentStreamEvent {
  type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function messageText(value: unknown): string {
  const tupleValue = Array.isArray(value) && value.length === 2 ? value[0] : value;
  const message = asRecord(tupleValue);
  if (!message) return '';
  if (message.type === 'content-block-delta') {
    return typeof asRecord(message.delta)?.text === 'string'
      ? String(asRecord(message.delta)?.text)
      : '';
  }
  if (typeof message.content === 'string') return message.content;
  if (!Array.isArray(message.content)) return '';
  return message.content.map((part) => {
    const block = asRecord(part);
    if (!block) return '';
    if (typeof block.text === 'string') return block.text;
    const delta = asRecord(block.delta);
    return typeof delta?.text === 'string' ? delta.text : '';
  }).join('');
}

function projectProductEvent(data: Record<string, unknown>): AgentStreamEvent[] {
  switch (data.event) {
    case 'session-started':
      return [{
        type: 'session.started',
        content: 'Session started',
        metadata: {
          session_id: data.sessionId,
          turnId: data.turnId,
          agentId: data.agentId,
          resumed: data.resumed,
        },
      }];
    case 'activity':
      return [{
        type: typeof data.kind === 'string' ? data.kind : 'progress.update',
        content: typeof data.message === 'string' ? data.message : '',
        metadata: asRecord(data.metadata) || {},
        ...(typeof data.timestamp === 'string' && data.timestamp
          ? { timestamp: data.timestamp }
          : {}),
      }];
    case 'input-required': {
      const interaction = asRecord(data.interaction) || {};
      return [{
        type: 'agent.input.required',
        content: typeof interaction.question === 'string' ? interaction.question : '',
        metadata: interaction,
      }];
    }
    case 'local-tool-call': {
      const call = asRecord(data.call) || {};
      return [{
        ...call,
        type: 'local.tool.call',
        metadata: asRecord(call.metadata) || {},
      }];
    }
    case 'knowledge-evidence':
      return [{
        type: 'knowledge.evidence',
        metadata: {
          documents: Array.isArray(data.documents) ? data.documents : [],
          query: data.query,
          kb_ids: Array.isArray(data.kbIds) ? data.kbIds : [],
          retrieval_count: data.retrievalCount,
          retrieval_time: data.retrievalTime,
          execution_id: data.executionId,
          turn_id: data.turnId,
          messageId: data.messageId,
          pluginId: 'knowledgebase-renderer',
          success: true,
        },
      }];
    case 'skills-selected':
      return [{
        type: 'skills.selected',
        metadata: {
          session_id: data.sessionId,
          agent_id: data.agentId,
          skill_ids: Array.isArray(data.skillIds)
            ? data.skillIds.filter((item): item is string => typeof item === 'string')
            : [],
        },
      }];
    case 'content-delta':
      return [{ type: 'content.delta', content: typeof data.delta === 'string' ? data.delta : '' }];
    case 'context-usage':
      return [{ type: 'context.usage', metadata: asRecord(data.usage) || {} }];
    case 'turn-committed': {
      const metadata = {
        session_id: data.sessionId,
        turnId: data.turnId,
        assistantMessageId: data.assistantMessageId,
        tokenUsage: data.tokenUsage,
        contextUsage: data.contextUsage,
        executionTime: data.executionTime,
        model: data.model,
        full_response: data.fullResponse,
      };
      const events: AgentStreamEvent[] = [{
        type: 'response.completed',
        content: typeof data.fullResponse === 'string' ? data.fullResponse : '',
        metadata,
      }];
      const usage = asRecord(data.contextUsage);
      if (usage) events.push({ type: 'context.usage', metadata: usage });
      return events;
    }
    case 'turn-persist-pending':
      return [{ ...data, type: 'turn.persist_pending' }];
    case 'error':
      return [{
        ...data,
        type: 'error.occurred',
        error: typeof data.message === 'string' ? data.message : 'Agent stream failed',
      }];
    case 'stream-ended':
      return [{ type: 'stream.ended' }];
    default:
      return [];
  }
}

/** Strict stateful projection from the LangGraph V3 wire envelope to product events. */
export class AgentStreamProtocolV3 {
  private lastSeq = 0;

  get sequence(): number {
    return this.lastSeq;
  }

  project(value: unknown): AgentStreamEvent[] {
    const event = asRecord(value);
    const params = asRecord(event?.params);
    if (
      event?.type !== 'event' ||
      typeof event.method !== 'string' ||
      !params ||
      !Number.isInteger(event.seq) ||
      event.seq !== this.lastSeq + 1
    ) {
      throw new Error('Invalid or non-contiguous LangGraph V3 event');
    }
    this.lastSeq = event.seq as number;

    if (event.method === 'custom:genispace') {
      const data = asRecord(params.data);
      return data ? projectProductEvent(data) : [];
    }
    if (event.method === 'messages') {
      const content = messageText(params.data);
      return content ? [{ type: 'content.delta', content }] : [];
    }
    if (event.method === 'tools') {
      const data = asRecord(params.data) || {};
      const rawName = data.name ?? data.toolName ?? data.tool_name;
      const name = typeof rawName === 'string' && rawName ? rawName : 'Tool execution';
      const args = asRecord(data.arguments) || asRecord(data.args) || asRecord(data.input);
      const result = data.result ?? data.output;
      return [{
        type: 'tool.execution',
        content: name,
        metadata: {
          ...data,
          toolName: name,
          tool_name: name,
          ...(args ? { tool_params: args, arguments: args } : {}),
          ...(result !== undefined ? { result } : {}),
        },
      }];
    }
    if (event.method === 'lifecycle' || event.method === 'input') return [];
    throw new Error(`Unsupported LangGraph V3 method: ${event.method}`);
  }
}
