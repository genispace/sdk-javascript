import { BaseClient } from '../client/base';
import { GeniSpaceConfig } from '../types';

/** Request body for `POST /operators/execute` (team-scoped UserOperator `identifier`). */
export interface OperatorExecuteRequest {
  config: {
    operatorId: string;
    methodId?: string;
  };
  inputs: Record<string, unknown>;
  context?: Record<string, unknown>;
}

/** Flat response from `POST /operators/execute` (no nested `data` envelope). */
export interface OperatorExecuteResponse {
  success: boolean;
  executionTime?: number;
  operator?: {
    id?: string;
    identifier?: string;
    name?: string;
    [key: string]: unknown;
  };
  result?: unknown;
  [key: string]: unknown;
}

/**
 * Team Operator execution (`POST /operators/execute`); requires authenticated user (Bearer accessToken or apiKey).
 * `baseURL` should include the API prefix, e.g. `https://api.genispace.ai/api`.
 */
export class Operators extends BaseClient {
  constructor(config: GeniSpaceConfig) {
    super(config);
  }

  /**
   * Run one enabled UserOperator method for the current team (from JWT / apiKey context).
   * @param request - `config.operatorId` is the team UserOperator `identifier`; `inputs` must be an object (use `{}` when empty).
   */
  async execute(request: OperatorExecuteRequest): Promise<OperatorExecuteResponse> {
    const body: OperatorExecuteRequest = {
      config: request.config,
      inputs: request.inputs ?? {},
      ...(request.context != null ? { context: request.context } : {}),
    };
    return this.postJsonBody<OperatorExecuteResponse>('/operators/execute', body);
  }
}
