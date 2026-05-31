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
/** Payload returned inside `data` for write operations (`POST /datasources/:id/data`). */
export interface DataSourceOperationResult {
    operationType?: string;
    affectedRows?: number;
    insertId?: number | string;
    executionTime?: number;
    statementCount?: number;
    [key: string]: unknown;
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
export declare class DataSources extends BaseClient {
    constructor(config: GeniSpaceConfig);
    /**
     * Paginated catalog; omit databaseId to search across the team's datasources.
     */
    listDataSources(params?: {
        page?: number;
        limit?: number;
        search?: string;
        databaseId?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    }): Promise<{
        items: DataSourceListItem[];
        pagination: DataSourceListPagination;
    }>;
    /**
     * READ datasource proxy (`queryData`): extra keys become SQL parameter bindings when the datasource defines `{{param}}` placeholders.
     */
    queryDataSourceRead(datasourceId: string, params?: Record<string, string | number | boolean | undefined> & {
        page?: number;
        limit?: number;
    }): Promise<DataSourceReadPayload>;
    /**
     * Execute a datasource write operation (TRANSACTION, CREATE, UPDATE, DELETE, BATCH_INSERT).
     */
    executeDataSourceOperation(datasourceId: string, inputData: Record<string, string | number | boolean | null | undefined>): Promise<DataSourceOperationResult>;
}
