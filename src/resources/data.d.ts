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
 * Team PostgreSQL allowlisted table access (`data/tables.json`); `dataScope` matches enabled GeniApp `identifier`.
 */
export declare class Data extends BaseClient {
    constructor(config: GeniSpaceConfig);
    private tablePath;
    /**
     * @param filter - passed as JSON string in query (eq filters on allowlisted columns)
     */
    listRows(dataScope: string, table: string, params?: {
        page?: number;
        pageSize?: number;
        sort?: string;
        filter?: Record<string, unknown>;
    }): Promise<DataListResult>;
    getRow(dataScope: string, table: string, id: string): Promise<Record<string, unknown>>;
    createRow(dataScope: string, table: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
    updateRow(dataScope: string, table: string, id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
    deleteRow(dataScope: string, table: string, id: string): Promise<void>;
}
