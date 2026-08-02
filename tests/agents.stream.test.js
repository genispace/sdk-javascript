const {
  AGENT_STREAM_PROTOCOL,
  AgentStreamDecoder,
  AgentStreamProtocolV3,
  AgentStreamClient,
} = require('../lib/streaming/index.cjs');
const { Agents } = require('../lib/resources/agents.cjs');

function responseWithFrames(frames, options = {}) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'X-GeniSpace-Stream-Protocol': options.protocol || AGENT_STREAM_PROTOCOL,
    },
  });
}

describe('LangGraph V3 agent stream SDK', () => {
  test('makes streaming explicit on the Agents resource and centralizes tool-result submission', async () => {
    const agents = Object.create(Agents.prototype);
    agents.config = { baseURL: 'https://api.example.test', apiKey: 'key' };
    agents.post = jest.fn(async () => ({ success: true }));
    await expect(agents.chat('agent-1', { contents: [], stream: true }))
      .rejects.toMatchObject({ code: 'AGENT_STREAM_METHOD_REQUIRED' });
    await expect(agents.chat('agent-1', { contents: [], stream: false })).resolves.toEqual({ success: true });
    await agents.submitToolResult('agent/one', {
      session_id: 'session-1', call_id: 'call-1', status: 'success', result: { ok: true },
    });
    expect(agents.post).toHaveBeenLastCalledWith(
      '/agents/agent%2Fone/tool-result',
      expect.objectContaining({ call_id: 'call-1' }),
    );
    expect(agents.chatStream('agent-1', { contents: [], stream: true })[Symbol.asyncIterator]).toBeDefined();
    expect(agents.builtinStream('knowledge_copilot', { inputs: {}, stream: true })[Symbol.asyncIterator]).toBeDefined();
  });

  test('projects content, activities, local tools and terminal product events', () => {
    const protocol = new AgentStreamProtocolV3();

    expect(protocol.project({
      type: 'event', method: 'messages', seq: 1,
      params: { data: { type: 'content-block-delta', delta: { text: 'hello' } } },
    })).toEqual([{ type: 'content.delta', content: 'hello' }]);

    expect(protocol.project({
      type: 'event', method: 'custom:genispace', seq: 2,
      params: { data: { event: 'activity', kind: 'thinking.update', message: 'reasoning', metadata: { stage: 'response' } } },
    })).toEqual([{ type: 'thinking.update', content: 'reasoning', metadata: { stage: 'response' } }]);

    expect(protocol.project({
      type: 'event', method: 'custom:genispace', seq: 3,
      params: { data: { event: 'local-tool-call', call: { type: 'local.tool.call', metadata: { call_id: 'call-1', tool: 'local.workbench.patch', params: { path: '/name' } } } } },
    })).toEqual([{ type: 'local.tool.call', metadata: { call_id: 'call-1', tool: 'local.workbench.patch', params: { path: '/name' } } }]);

    expect(protocol.project({
      type: 'event', method: 'custom:genispace', seq: 4,
      params: { data: { event: 'turn-committed', fullResponse: 'done', sessionId: 'session-1', turnId: 'turn-1' } },
    })[0]).toMatchObject({ type: 'response.completed', content: 'done' });

    expect(protocol.project({
      type: 'event', method: 'custom:genispace', seq: 5,
      params: { data: { event: 'skills-selected', sessionId: 'session-1', agentId: 'assistant', skillIds: ['skill-a', 3] } },
    })).toEqual([{ type: 'skills.selected', metadata: { session_id: 'session-1', agent_id: 'assistant', skill_ids: ['skill-a'] } }]);

    expect(protocol.project({
      type: 'event', method: 'custom:genispace', seq: 6,
      params: { data: { event: 'stream-ended' } },
    })).toEqual([{ type: 'stream.ended' }]);
  });

  test('fails closed for sequence gaps and unsupported methods', () => {
    const gap = new AgentStreamProtocolV3();
    expect(() => gap.project({
      type: 'event', method: 'messages', seq: 2, params: { data: { content: 'late' } },
    })).toThrow('Invalid or non-contiguous LangGraph V3 event');

    const unsupported = new AgentStreamProtocolV3();
    expect(() => unsupported.project({
      type: 'event', method: 'debug', seq: 1, params: {},
    })).toThrow('Unsupported LangGraph V3 method: debug');
  });

  test('incrementally decodes split and multiline SSE frames for proxy consumers', () => {
    const encoder = new TextEncoder();
    const decoder = new AgentStreamDecoder();
    const wire = JSON.stringify({
      type: 'event', method: 'messages', seq: 1, params: { data: { content: 'hello' } },
    });
    expect(decoder.push(encoder.encode(`data: ${wire.slice(0, 25)}`))).toEqual([]);
    expect(decoder.push(encoder.encode(`${wire.slice(25)}\n\n`))).toEqual([
      { type: 'content.delta', content: 'hello' },
    ]);
    expect(decoder.finish()).toEqual([]);
    expect(decoder.finish()).toEqual([]);
    expect(() => decoder.push(encoder.encode('data: {}\n\n')))
      .toThrow('Agent stream decoder is already closed');
  });

  test('projects the remaining product, tool, input and message variants', () => {
    const protocol = new AgentStreamProtocolV3();
    let seq = 0;
    const product = (data) => protocol.project({
      type: 'event', method: 'custom:genispace', seq: ++seq, params: { data },
    });
    expect(product({ event: 'session-started', sessionId: 's', turnId: 't', agentId: 'a', resumed: true })[0])
      .toMatchObject({ type: 'session.started', metadata: { session_id: 's', turnId: 't' } });
    expect(product({ event: 'input-required', interaction: { question: 'Choose', options: [] } })[0])
      .toMatchObject({ type: 'agent.input.required', content: 'Choose' });
    expect(product({ event: 'knowledge-evidence', query: 'policy', documents: [{ documentId: 'd' }] })[0])
      .toMatchObject({ type: 'knowledge.evidence', metadata: { query: 'policy' } });
    expect(product({ event: 'content-delta', delta: 'delta' })).toEqual([{ type: 'content.delta', content: 'delta' }]);
    expect(product({ event: 'context-usage', usage: { usedPercent: 50 } })[0]).toMatchObject({ type: 'context.usage' });
    expect(product({ event: 'turn-persist-pending', turnId: 't' })[0]).toMatchObject({ type: 'turn.persist_pending' });
    expect(product({ event: 'error', message: 'failed' })[0]).toMatchObject({ type: 'error.occurred', error: 'failed' });
    expect(product({ event: 'unknown-product-event' })).toEqual([]);
    expect(protocol.project({
      type: 'event', method: 'messages', seq: ++seq,
      params: { data: { content: [{ text: 'one' }, { delta: { text: ' two' } }] } },
    })).toEqual([{ type: 'content.delta', content: 'one two' }]);
    expect(protocol.project({
      type: 'event', method: 'tools', seq: ++seq, params: { data: { name: 'lookup', status: 'done' } },
    })[0]).toMatchObject({ type: 'tool.execution', content: 'lookup' });
    expect(protocol.project({
      type: 'event', method: 'lifecycle', seq: ++seq, params: {},
    })).toEqual([]);
    expect(protocol.project({
      type: 'event', method: 'input', seq: ++seq, params: {},
    })).toEqual([]);
  });

  test('sends and acknowledges V3, parses split SSE frames, and exposes typed events', async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init.headers['X-GeniSpace-Stream-Protocol']).toBe(AGENT_STREAM_PROTOCOL);
      expect(init.headers.Authorization).toBe('Bearer access-token');
      expect(JSON.parse(init.body)).toMatchObject({ turnId: 'turn-1', stream: true });
      return responseWithFrames([
        { type: 'event', method: 'custom:genispace', seq: 1, params: { data: { event: 'session-started', sessionId: 'session-1', turnId: 'turn-1' } } },
        { type: 'event', method: 'messages', seq: 2, params: { data: { content: 'answer' } } },
      ]);
    });
    const client = new AgentStreamClient({
      baseURL: 'https://api.example.test',
      apiKey: '',
      accessToken: 'access-token',
      fetch: fetchMock,
    });

    const events = [];
    for await (const event of client.chat('agent/id', {
      contents: [{ type: 'text', text: 'hello' }],
      session_id: 'session-1',
      turnId: 'turn-1',
      stream: true,
    })) events.push(event);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/agents/agent%2Fid/chat',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(events).toEqual([
      expect.objectContaining({ type: 'session.started' }),
      { type: 'content.delta', content: 'answer' },
    ]);
  });

  test('rejects 426 responses and missing protocol acknowledgement', async () => {
    const rejected = new AgentStreamClient({
      baseURL: 'https://api.example.test', apiKey: 'key',
      fetch: jest.fn(async () => new Response('upgrade required', { status: 426 })),
    });
    await expect(async () => {
      for await (const _event of rejected.chat('agent-1', { contents: [], stream: true })) { /* pass */ }
    }).rejects.toMatchObject({ statusCode: 426 });

    const unacknowledged = new AgentStreamClient({
      baseURL: 'https://api.example.test', apiKey: 'key',
      fetch: jest.fn(async () => responseWithFrames([], { protocol: 'wrong' })),
    });
    await expect(async () => {
      for await (const _event of unacknowledged.chat('agent-1', { contents: [], stream: true })) { /* pass */ }
    }).rejects.toThrow('did not acknowledge LangGraph V3 protocol');
  });

  test('streams built-in agents through the dedicated endpoint', async () => {
    const fetchMock = jest.fn(async () => responseWithFrames([]));
    const client = new AgentStreamClient({ baseURL: 'https://api.example.test/', apiKey: 'key', fetch: fetchMock });
    for await (const _event of client.builtin('knowledge_copilot', {
      inputs: { message: 'policy' }, kb_ids: ['kb-1'], stream: true,
    })) { /* pass */ }
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/builtin-agents/knowledge_copilot/stream');
  });

  test('rejects malformed SSE JSON and unavailable response bodies', async () => {
    const malformed = new AgentStreamClient({
      baseURL: 'https://api.example.test', apiKey: 'key',
      fetch: jest.fn(async () => new Response('data: not-json\n\n', {
        headers: { 'X-GeniSpace-Stream-Protocol': AGENT_STREAM_PROTOCOL },
      })),
    });
    await expect(async () => {
      for await (const _event of malformed.chat('agent', {})) { /* pass */ }
    }).rejects.toMatchObject({ code: 'INVALID_AGENT_STREAM_JSON' });

    const unavailable = new AgentStreamClient({
      baseURL: 'https://api.example.test', apiKey: 'key',
      fetch: jest.fn(async () => new Response(null, {
        headers: { 'X-GeniSpace-Stream-Protocol': AGENT_STREAM_PROTOCOL },
      })),
    });
    await expect(async () => {
      for await (const _event of unavailable.chat('agent', {})) { /* pass */ }
    }).rejects.toMatchObject({ code: 'STREAM_UNAVAILABLE' });
  });
});
