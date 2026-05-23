import { BaseClient } from '../client/base';
import { GeniSpaceConfig } from '../types';

/**
 * List response for `GET /data/:dataScope/tables/:table` (under API base, e.g. `/api/data/...`).
 */
export interface DataListResult<T = Record<string, unknown>> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Allowlisted PostgreSQL table access (`data/tables.json`); `dataScope` matches the enabled GeniApp `identifier`.
 * Requests target the space database implied by the token; filters apply to business columns declared in the contract.
 */
export class Data extends BaseClient {
  constructor(config: GeniSpaceConfig) {
    super(config);
  }

  private tablePath(dataScope: string, table: string, rowId?: string) {
    const t = encodeURIComponent(table);
    const id = rowId != null && rowId !== '' ? `/${encodeURIComponent(String(rowId))}` : '';
    return `/data/${encodeURIComponent(dataScope)}/tables/${t}${id}`;
  }

  /**
   * @param filter - passed as JSON string in query (eq filters on allowlisted columns)
   */
  async listRows(
    dataScope: string,
    table: string,
    params?: {
      page?: number;
      pageSize?: number;
      sort?: string;
      filter?: Record<string, unknown>;
    }
  ): Promise<DataListResult> {
    const filterParam =
      params?.filter && typeof params.filter === 'object'
        ? JSON.stringify(params.filter)
        : undefined;
    const res = await this.get<{ data: { items: unknown[]; pagination: DataListResult['pagination'] } }>(
      this.tablePath(dataScope, table),
      {
        page: params?.page,
        pageSize: params?.pageSize,
        sort: params?.sort,
        ...(filterParam ? { filter: filterParam } : {}),
      }
    );
    const d = (res as any).data;
    if (d && d.items) {
      return { items: d.items, pagination: d.pagination };
    }
    return (res as any) as DataListResult;
  }

  async getRow(
    dataScope: string,
    table: string,
    id: string
  ): Promise<Record<string, unknown>> {
    const res = await this.get<{ data: Record<string, unknown> }>(this.tablePath(dataScope, table, id));
    return ((res as any).data || res) as Record<string, unknown>;
  }

  async createRow(
    dataScope: string,
    table: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await this.post<{ data: Record<string, unknown> }>(this.tablePath(dataScope, table), body);
    return ((res as any).data || res) as Record<string, unknown>;
  }

  async updateRow(
    dataScope: string,
    table: string,
    id: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await this.patch<{ data: Record<string, unknown> }>(this.tablePath(dataScope, table, id), body);
    return ((res as any).data || res) as Record<string, unknown>;
  }

  async deleteRow(dataScope: string, table: string, id: string): Promise<void> {
    await this.delete(this.tablePath(dataScope, table, id));
  }
}
