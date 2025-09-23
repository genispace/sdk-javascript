import { BaseClient } from '../client/base';
import { 
  ApiKey, 
  CreateApiKeyRequest, 
  GeniSpaceApiKeyResponse 
} from '../types';

/**
 * API Key 管理资源
 */
export class ApiKeys extends BaseClient {
  
  /**
   * 获取用户的所有 API 密钥
   */
  async list(): Promise<ApiKey[]> {
    return this.get<ApiKey[]>('/api-keys');
  }

  /**
   * 创建新的 API 密钥
   */
  async create(data: CreateApiKeyRequest): Promise<GeniSpaceApiKeyResponse> {
    return this.post<GeniSpaceApiKeyResponse>('/api-keys', data);
  }

  /**
   * 获取单个 API 密钥详情
   */
  async getApiKey(keyId: string): Promise<ApiKey> {
    return this.get<ApiKey>(`/api-keys/${keyId}`);
  }

  /**
   * 更新 API 密钥信息
   */
  async update(keyId: string, data: Partial<{
    name: string;
    application: string;
    expiresAt: string | null;
    permissions: string[];
  }>): Promise<ApiKey> {
    return this.put<ApiKey>(`/api-keys/${keyId}`, data);
  }

  /**
   * 撤销 API 密钥
   */
  async revoke(keyId: string): Promise<ApiKey> {
    return this.post<ApiKey>(`/api-keys/${keyId}/revoke`);
  }

  /**
   * 获取团队的所有 API 密钥
   */
  async listTeamKeys(teamId: string): Promise<ApiKey[]> {
    return this.get<ApiKey[]>(`/api-keys/teams/${teamId}`);
  }

  /**
   * 获取团队成员的 API 密钥
   */
  async listMemberKeys(teamId: string, memberId: string): Promise<ApiKey[]> {
    return this.get<ApiKey[]>(`/api-keys/teams/${teamId}/members/${memberId}`);
  }

  /**
   * 团队管理员撤销成员的 API 密钥
   */
  async revokeMemberKey(teamId: string, memberId: string, keyId: string): Promise<ApiKey> {
    return this.post<ApiKey>(`/api-keys/teams/${teamId}/members/${memberId}/${keyId}/revoke`);
  }

  /**
   * 验证 API 密钥有效性
   */
  async validate(apiKey: string): Promise<{
    valid: boolean;
    keyInfo?: {
      id: string;
      name: string;
      application?: string;
      expiresAt?: string;
      permissions?: string[];
      owner: {
        id: string;
        email: string;
        name: string;
      };
    };
    reason?: string;
  }> {
    // 验证接口使用无认证的端点
    return this.postWithoutAuth<{
      valid: boolean;
      keyInfo?: {
        id: string;
        name: string;
        application?: string;
        expiresAt?: string;
        permissions?: string[];
        owner: {
          id: string;
          email: string;
          name: string;
        };
      };
      reason?: string;
    }>('/validate/api-key', { apiKey });
  }
}
