import { GeniSpaceConfig } from './types';
import { Users } from './resources/users';
import { ApiKeys } from './resources/apiKeys';
import { Agents } from './resources/agents';
import { Tasks } from './resources/tasks';
import { Storage } from './resources/storage';
import { Data } from './resources/data';
import { DataSources } from './resources/dataSources';
import { Operators } from './resources/operators';
export { Data } from './resources/data';
export type { DataListResult } from './resources/data';
export { DataSources } from './resources/dataSources';
export type { DataSourceListItem, DataSourceListPagination, DataSourceReadPayload, } from './resources/dataSources';
export { Operators } from './resources/operators';
export type { OperatorExecuteRequest, OperatorExecuteResponse } from './resources/operators';
/**
 * GeniSpace SDK 主客户端
 */
export declare class GeniSpace {
    private config;
    users: Users;
    apiKeys: ApiKeys;
    agents: Agents;
    tasks: Tasks;
    storage: Storage;
    data: Data;
    dataSources: DataSources;
    operators: Operators;
    constructor(config: GeniSpaceConfig);
    /**
     * 更新 API Key
     */
    updateApiKey(apiKey: string): void;
    /**
     * 更新基础 URL
     */
    updateBaseURL(baseURL: string): void;
    /**
     * 设置 OAuth / 会话 access token（优先于 API Key 作为 Authorization，用于 GeniApp 等浏览器场景）
     */
    updateAccessToken(accessToken: string | undefined): void;
    /**
     * 获取当前配置
     */
    getConfig(): GeniSpaceConfig;
}
export * from './types';
export { GeniSpaceError } from './types';
export default GeniSpace;
