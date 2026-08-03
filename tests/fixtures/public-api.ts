import {
  AgentStreamClient,
  type AgentStreamEvent,
  GeniSpace,
} from '../../lib/index.mjs';

const sdk = new GeniSpace({ apiKey: 'test-key' });
const client: AgentStreamClient = new AgentStreamClient({ apiKey: 'test-key' });
const event: AgentStreamEvent = { type: 'content', content: 'ok' };

void client;
void event;
void sdk.agents.submitToolResult('agent-id', {
  session_id: 'session-id',
  call_id: 'call-id',
  status: 'success',
  result: { accepted: true },
});
