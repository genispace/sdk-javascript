import { GeniSpaceError } from '../types';
import {
  AGENT_STREAM_PROTOCOL,
  AgentStreamEvent,
  AgentStreamProtocolV3,
} from './protocol';

/** Minimal POST request surface used by the streaming client in browsers and Node.js. */
export interface AgentFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export type AgentFetch = (input: string, init?: AgentFetchInit) => Promise<Response>;

export interface AgentStreamClientConfig {
  baseURL?: string;
  apiKey: string;
  accessToken?: string;
  fetch?: AgentFetch;
}

export interface AgentStreamRequestOptions {
  signal?: AbortSignal;
  language?: string;
  headers?: Record<string, string>;
  /** Called after a successful response has acknowledged the V3 protocol. */
  onOpen?: (response: Response) => void | Promise<void>;
}

export interface BuiltinAgentStreamRequest {
  inputs: Record<string, unknown>;
  kb_ids?: string[];
  session_id?: string;
  lang?: string;
  model?: Record<string, unknown>;
  stream?: true;
}

function trimBaseURL(value: string | undefined): string {
  return (value || 'https://api.genispace.ai').replace(/\/+$/, '');
}

async function errorFromResponse(response: Response): Promise<GeniSpaceError> {
  const body = await response.text();
  let message = body || `HTTP ${response.status}: ${response.statusText}`;
  let code = `HTTP_${response.status}`;
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string; code?: string };
    message = parsed.message || parsed.error || message;
    code = parsed.code || code;
  } catch {
    // Non-JSON gateway errors retain their response text.
  }
  return new GeniSpaceError(message, code, response.status);
}

/** Stateful byte decoder shared by direct clients and byte-forwarding desktop proxies. */
export class AgentStreamDecoder {
  private readonly textDecoder = new TextDecoder();
  private readonly protocol: AgentStreamProtocolV3;
  private buffer = '';
  private ended = false;

  constructor(protocol = new AgentStreamProtocolV3()) {
    this.protocol = protocol;
  }

  push(value: Uint8Array): AgentStreamEvent[] {
    if (this.ended) throw new GeniSpaceError('Agent stream decoder is already closed', 'STREAM_DECODER_CLOSED');
    this.buffer += this.textDecoder.decode(value, { stream: true });
    return this.drain(false);
  }

  finish(): AgentStreamEvent[] {
    if (this.ended) return [];
    this.ended = true;
    this.buffer += this.textDecoder.decode();
    return this.drain(true);
  }

  private projectFrame(frame: string): AgentStreamEvent[] {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new GeniSpaceError('Invalid JSON in agent event stream', 'INVALID_AGENT_STREAM_JSON');
    }
    return this.protocol.project(parsed);
  }

  private drain(flush: boolean): AgentStreamEvent[] {
    const events: AgentStreamEvent[] = [];
    let boundary = this.buffer.search(/\r?\n\r?\n/);
    while (boundary >= 0) {
      const matched = this.buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] || '\n\n';
      events.push(...this.projectFrame(this.buffer.slice(0, boundary)));
      this.buffer = this.buffer.slice(boundary + matched.length);
      boundary = this.buffer.search(/\r?\n\r?\n/);
    }
    if (flush && this.buffer.trim()) {
      events.push(...this.projectFrame(this.buffer));
      this.buffer = '';
    }
    return events;
  }
}

async function* parseSse(
  response: Response,
  protocol: AgentStreamProtocolV3,
): AsyncGenerator<AgentStreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new GeniSpaceError('Stream response is unavailable', 'STREAM_UNAVAILABLE');
  const decoder = new AgentStreamDecoder(protocol);

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const event of decoder.push(value)) yield event;
    }
    for (const event of decoder.finish()) yield event;
  } finally {
    reader.releaseLock();
  }
}

export class AgentStreamClient {
  private readonly config: AgentStreamClientConfig;
  private readonly fetcher: AgentFetch;

  constructor(config: AgentStreamClientConfig) {
    this.config = config;
    const fetcher = config.fetch || globalThis.fetch;
    if (typeof fetcher !== 'function') {
      throw new GeniSpaceError('This runtime does not provide fetch', 'FETCH_UNAVAILABLE');
    }
    this.fetcher = fetcher.bind(globalThis) as AgentFetch;
  }

  chat(
    agentId: string,
    body: object,
    options?: AgentStreamRequestOptions,
  ): AsyncGenerator<AgentStreamEvent> {
    return this.open(`/agents/${encodeURIComponent(agentId)}/chat`, body, options);
  }

  builtin(
    agentId: string,
    body: BuiltinAgentStreamRequest,
    options?: AgentStreamRequestOptions,
  ): AsyncGenerator<AgentStreamEvent> {
    return this.open(`/builtin-agents/${encodeURIComponent(agentId)}/stream`, body, options);
  }

  streamPath(
    path: string,
    body: object,
    options?: AgentStreamRequestOptions,
  ): AsyncGenerator<AgentStreamEvent> {
    return this.open(path, body, options);
  }

  private async *open(
    path: string,
    body: object,
    options?: AgentStreamRequestOptions,
  ): AsyncGenerator<AgentStreamEvent> {
    const token = this.config.accessToken || this.config.apiKey;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-GeniSpace-Stream-Protocol': AGENT_STREAM_PROTOCOL,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.language ? { 'Accept-Language': options.language, 'X-Language': options.language } : {}),
      ...options?.headers,
    };
    const response = await this.fetcher(`${trimBaseURL(this.config.baseURL)}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: true }),
      signal: options?.signal,
    });
    if (!response.ok) throw await errorFromResponse(response);
    if (response.headers.get('X-GeniSpace-Stream-Protocol') !== AGENT_STREAM_PROTOCOL) {
      throw new GeniSpaceError(
        'Agent stream did not acknowledge LangGraph V3 protocol',
        'INVALID_AGENT_STREAM_PROTOCOL',
      );
    }
    await options?.onOpen?.(response);
    yield* parseSse(response, new AgentStreamProtocolV3());
  }
}
