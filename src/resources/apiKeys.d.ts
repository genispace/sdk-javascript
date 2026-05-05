import { BaseClient } from '../client/base';
import { ApiKey, CreateApiKeyRequest, GeniSpaceApiKeyResponse } from '../types';
/**
 * API Key 管理资源
 */
export declare class ApiKeys extends BaseClient {
    /**
     * 获取用户的所有 API 密钥
     */
    list(): Promise<ApiKey[]>;
    /**
     * 创建新的 API 密钥
     */
    create(data: CreateApiKeyRequest): Promise<GeniSpaceApiKeyResponse>;
    /**
     * 获取单个 API 密钥详情
     */
    getApiKey(keyId: string): Promise<ApiKey>;
    /**
     * 更新 API 密钥信息
     */
    update(keyId: string, data: Partial<{
        name: string;
        application: string;
        expiresAt: string | null;
        permissions: string[];
    }>): Promise<ApiKey>;
    /**
     * 撤销 API 密钥
     */
    revoke(keyId: string): Promise<ApiKey>;
    /**
     * 获取团队的所有 API 密钥
     */
    listTeamKeys(teamId: string): Promise<ApiKey[]>;
    /**
     * 获取团队成员的 API 密钥
     */
    listMemberKeys(teamId: string, memberId: string): Promise<ApiKey[]>;
    /**
     * 团队管理员撤销成员的 API 密钥
     */
    revokeMemberKey(teamId: string, memberId: string, keyId: string): Promise<ApiKey>;
    /**
     * 验证 API 密钥有效性
     */
    validate(apiKey: string): Promise<{
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
    }>;
}
