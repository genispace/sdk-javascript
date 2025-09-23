import { GeniSpaceConfig } from './types';
import { Users } from './resources/users';
import { ApiKeys } from './resources/apiKeys';
import { Agents } from './resources/agents';
import { Tasks } from './resources/tasks';

/**
 * GeniSpace SDK 主客户端
 */
export class GeniSpace {
  private config: GeniSpaceConfig;

  public users: Users;
  public apiKeys: ApiKeys;
  public agents: Agents;
  public tasks: Tasks;

  constructor(config: GeniSpaceConfig) {
    this.config = config;

    // 初始化各个资源客户端
    this.users = new Users(config);
    this.apiKeys = new ApiKeys(config);
    this.agents = new Agents(config);
    this.tasks = new Tasks(config);
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

// CommonJS 兼容性
module.exports = GeniSpace;
module.exports.default = GeniSpace;
module.exports.GeniSpace = GeniSpace;
module.exports.GeniSpaceError = require('./types').GeniSpaceError;
