import { BaseClient } from '../client/base';
import { GeniSpaceConfig } from '../types';

/** Row from `GET /datasources` list (team-scoped). */
export interface DataSourceListItem {
  id: string;
  identifier?: string | null;
  name?: string | null;
  description?: string | null;
  operationType?: string | null;
  status?: string | null;
  databaseId?: string | null;
  sqlStatement?: string | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface DataSourceListPagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

/** Payload returned inside `data` for `GET /datasources/:id/data` (READ). */
export interface DataSourceReadPayload {
  data: Record<string, unknown>[];
  metadata?: {
    operationType?: string;
    columns?: string[];
    fields?: unknown[];
    rowCount?: number;
    executionTime?: number;
    [key: string]: unknown;
  };
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

/**
 * Team SQL DataSources (`/datasources`); requires `team.datasource.read` for list/query.
 */
export class DataSources extends BaseClient {
  constructor(config: GeniSpaceConfig) {
    super(config);
  }

  /**
   * Paginated catalog; omit databaseId to search across the team's datasources.
   */
  async listDataSources(params?: {
    page?: number;
    limit?: number;
    search?: string;
    databaseId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  }): Promise<{ items: DataSourceListItem[]; pagination: DataSourceListPagination }> {
    const res = await this.get<{ data: DataSourceListItem[]; pagination: DataSourceListPagination }>(
      '/datasources',
      {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.databaseId ? { databaseId: params.databaseId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      }
    );
    const raw = res as unknown as {
      data?: DataSourceListItem[];
      pagination?: DataSourceListPagination;
    };
    const items = Array.isArray(raw.data) ? raw.data : [];
    const pagination = raw.pagination || { page: params?.page ?? 1, limit: params?.limit ?? 100 };
    return { items, pagination };
  }

  /**
   * READ datasource proxy (`queryData`): extra keys become SQL parameter bindings when the datasource defines `{{param}}` placeholders.
   */
  async queryDataSourceRead(
    datasourceId: string,
    params?: Record<string, string | number | boolean | undefined> & {
      page?: number;
      limit?: number;
    }
  ): Promise<DataSourceReadPayload> {
    const { page, limit, ...rest } = params || {};
    const res = await this.get<{ data: DataSourceReadPayload }>(`/datasources/${encodeURIComponent(datasourceId)}/data`, {
      ...(page != null ? { page } : {}),
      ...(limit != null ? { limit } : {}),
      ...serializeQueryParams(rest),
    });
    const raw = res as unknown as { data?: DataSourceReadPayload };
    const payload = raw.data;
    if (payload && Array.isArray(payload.data)) {
      return payload;
    }
    return { data: [], metadata: {}, pagination: undefined };
  }
}

function serializeQueryParams(
  obj: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}
