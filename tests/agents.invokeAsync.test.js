/**
 * Agents.invokeAsync — async agent-invoke progress UX v1.
 * Runs against the compiled output: `npm run build` before `npm test`.
 */
const { Agents } = require('../lib/resources/agents.cjs');

/** An Agents instance with stubbed HTTP verbs (no real BaseClient config). */
function makeAgents({ post, get }) {
  const agents = Object.create(Agents.prototype);
  agents.post = post;
  agents.get = get;
  return agents;
}

const AGENT_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('Agents.invokeAsync', () => {
  test('fires onCreated with the 202 job before the first poll and resolves with job.result', async () => {
    const events = [];
    const post = jest.fn(async () => ({
      data: { id: 'job-1', status: 'PENDING', createdAt: '2026-01-01T00:00:00Z' },
    }));
    const get = jest.fn(async () => {
      events.push('poll');
      return { data: { id: 'job-1', status: 'SUCCEEDED', result: { output: 'ok' } } };
    });
    const agents = makeAgents({ post, get });

    const result = await agents.invokeAsync(
      AGENT_ID,
      { input: 'hi' },
      {
        pollIntervalMs: 1,
        onCreated: (job) => events.push(`created:${job.id}:${job.status}`),
        onProgress: (job) => events.push(`progress:${job.status}`),
      }
    );

    expect(result).toEqual({ output: 'ok' });
    expect(events[0]).toBe('created:job-1:PENDING');
    expect(events.indexOf('poll')).toBeGreaterThan(0);
    expect(post).toHaveBeenCalledWith('/agent-jobs', {
      type: 'AGENT_INVOKE',
      payload: { agentId: AGENT_ID, inputs: { input: 'hi' } },
    });
  });

  test('stops polling and throws an AbortError when the signal aborts (job keeps running server-side)', async () => {
    const post = jest.fn(async () => ({ data: { id: 'job-2', status: 'PENDING' } }));
    let polls = 0;
    const controller = new AbortController();
    const get = jest.fn(async () => {
      polls += 1;
      controller.abort(); // abort mid-flight; next iteration must bail out
      return { data: { id: 'job-2', status: 'RUNNING' } };
    });
    const agents = makeAgents({ post, get });

    await expect(
      agents.invokeAsync(AGENT_ID, {}, { pollIntervalMs: 1, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(polls).toBe(1); // no polling after the abort

    // The error carries the last observed job snapshot.
    const err = await agents
      .invokeAsync(AGENT_ID, {}, { pollIntervalMs: 1, signal: controller.signal })
      .catch((e) => e);
    expect(err.name).toBe('AbortError');
    expect(err.job).toMatchObject({ id: 'job-2' });
  });

  test('an already-aborted signal aborts before any poll', async () => {
    const post = jest.fn(async () => ({ data: { id: 'job-3', status: 'PENDING' } }));
    const get = jest.fn();
    const agents = makeAgents({ post, get });
    const controller = new AbortController();
    controller.abort();

    await expect(
      agents.invokeAsync(AGENT_ID, {}, { signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(get).not.toHaveBeenCalled();
  });

  test('surfaces FAILED jobs as errors with .job attached (unchanged behavior)', async () => {
    const post = jest.fn(async () => ({ data: { id: 'job-4', status: 'PENDING' } }));
    const get = jest.fn(async () => ({ data: { id: 'job-4', status: 'FAILED', error: 'boom' } }));
    const agents = makeAgents({ post, get });

    const err = await agents.invokeAsync(AGENT_ID, {}, { pollIntervalMs: 1 }).catch((e) => e);
    expect(err.message).toBe('boom');
    expect(err.job).toMatchObject({ id: 'job-4', status: 'FAILED' });
  });
});
