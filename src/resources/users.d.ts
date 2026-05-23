import { BaseClient } from '../client/base';
import { User, UserPreferences, UpdatePasswordRequest } from '../types';
/**
 * 用户管理资源
 */
export declare class Users extends BaseClient {
    /**
     * 获取当前用户资料
     */
    getProfile(): Promise<User>;
    /**
     * 更新当前用户资料
     */
    updateProfile(data: Partial<Pick<User, 'name' | 'email' | 'company'>>): Promise<User>;
    /**
     * 修改密码
     */
    updatePassword(data: UpdatePasswordRequest): Promise<{
        message: string;
    }>;
    /**
     * 获取用户完整设置（spaceId + preferences）
     */
    getSettings(): Promise<{
        spaceId: string | null;
        preferences: UserPreferences;
    }>;
    /**
     * 更新用户完整设置（spaceId + preferences）
     * 支持部分更新
     */
    updateSettings(data: Partial<{
        spaceId: string | null;
        preferences: Partial<UserPreferences>;
    }>): Promise<{
        spaceId: string | null;
        preferences: UserPreferences;
    }>;
    /**
     * 绑定手机号
     */
    bindPhone(phoneNumber: string): Promise<{
        message: string;
    }>;
    /**
     * 获取用户的团队列表
     */
    getTeams(): Promise<Array<{
        id: string;
        name: string;
        role: string;
        isActive: boolean;
    }>>;
    /**
     * 获取用户统计信息
     */
    getStatistics(): Promise<{
        tasksCreated: number;
        tasksCompleted: number;
        successRate: number;
        activeWorkflows: number;
        agentsCount: number;
        operatorsCount: number;
        teamsCount: number;
        knowledgeBasesCount: number;
    }>;
}
