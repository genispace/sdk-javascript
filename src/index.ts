import { GeniSpaceConfig } from './types';
import { Users } from './resources/users';
import { ApiKeys } from './resources/apiKeys';
import { Agents } from './resources/agents';
import { Tasks } from './resources/tasks';
import { Storage } from './resources/storage';
import { Data } from './resources/data';
import { DataSources } from './resources/dataSources';
import { Workbenches } from './resources/workbenches';

export { Data } from './resources/data';
export type { DataListResult } from './resources/data';
export { DataSources } from './resources/dataSources';
export type {
  DataSourceListItem,
  DataSourceListPagination,
  DataSourceReadPayload,
} from './resources/dataSources';

/**
 * GeniSpace SDK 主客户端
 */
export class GeniSpace {
  private config: GeniSpaceConfig;

  public users: Users;
  public apiKeys: ApiKeys;
  public agents: Agents;
  public tasks: Tasks;
  public storage: Storage;
  public data: Data;
  public dataSources: DataSources;
  public workbenches: Workbenches;

  constructor(config: GeniSpaceConfig) {
    this.config = config;

    // 初始化各个资源客户端
    this.users = new Users(config);
    this.apiKeys = new ApiKeys(config);
    this.agents = new Agents(config);
    this.tasks = new Tasks(config);
    this.storage = new Storage(config);
    this.data = new Data(config);
    this.dataSources = new DataSources(config);
    this.workbenches = new Workbenches(config);
  }

  /**
   * 更新 API Key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.users.updateApiKey(apiKey);
    this.apiKeys.updateApiKey(apiKey);
    this.agents.updateApiKey(apiKey);
    this.tasks.updateApiKey(apiKey);
    this.storage.updateApiKey(apiKey);
    this.data.updateApiKey(apiKey);
    this.dataSources.updateApiKey(apiKey);
    this.workbenches.updateApiKey(apiKey);
  }

  /**
   * 更新基础 URL
   */
  updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.users.updateBaseURL(baseURL);
    this.apiKeys.updateBaseURL(baseURL);
    this.agents.updateBaseURL(baseURL);
    this.tasks.updateBaseURL(baseURL);
    this.storage.updateBaseURL(baseURL);
    this.data.updateBaseURL(baseURL);
    this.dataSources.updateBaseURL(baseURL);
    this.workbenches.updateBaseURL(baseURL);
  }

  /**
   * 设置 OAuth / 会话 access token（优先于 API Key 作为 Authorization，用于 GeniApp 等浏览器场景）
   */
  updateAccessToken(accessToken: string | undefined): void {
    (this.config as GeniSpaceConfig & { accessToken?: string }).accessToken = accessToken;
    this.users.updateAccessToken(accessToken);
    this.apiKeys.updateAccessToken(accessToken);
    this.agents.updateAccessToken(accessToken);
    this.tasks.updateAccessToken(accessToken);
    this.storage.updateAccessToken(accessToken);
    this.data.updateAccessToken(accessToken);
    this.dataSources.updateAccessToken(accessToken);
    this.workbenches.updateAccessToken(accessToken);
  }

  /**
   * 获取当前配置
   */
  getConfig(): GeniSpaceConfig {
    return { ...this.config };
  }
}

// 导出所有类型
export * from './types';

// 导出错误类
export { GeniSpaceError } from './types';

// 默认导出
export default GeniSpace;

// 勿在此添加 `module.exports`：浏览器/Vite MF 打包会报 `module is not defined`。Node 请用
// `require('genispace').default` 或 `require('genispace').GeniSpace`（与 tsc 的 `exports.*` 一致）。
