import { BaseClient } from '../client/base';
import {
  User,
  UserPreferences,
  UpdatePasswordRequest,
  PublicUserProfile,
} from '../types';

function unwrapData<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * 用户管理资源
 */
export class Users extends BaseClient {
  
  /**
   * 获取当前用户资料
   */
  async getProfile(): Promise<User> {
    return this.get<User>('/users/me');
  }

  /**
   * 更新当前用户资料
   */
  async updateProfile(data: Partial<Pick<User, 'name' | 'email' | 'company'>>): Promise<User> {
    return this.put<User>('/users/me', data);
  }

  /**
   * 修改密码
   */
  async updatePassword(data: UpdatePasswordRequest): Promise<{ message: string }> {
    return this.put<{ message: string }>('/users/me/password', data);
  }

  /**
   * 获取用户完整设置（teamId + preferences）
   */
  async getSettings(): Promise<{ teamId: string | null; preferences: UserPreferences }> {
    return this.get<{ teamId: string | null; preferences: UserPreferences }>('/users/me/settings');
  }

  /**
   * 更新用户完整设置（teamId + preferences）
   * 支持部分更新
   */
  async updateSettings(data: Partial<{ teamId: string | null; preferences: Partial<UserPreferences> }>): Promise<{ teamId: string | null; preferences: UserPreferences }> {
    return this.put<{ teamId: string | null; preferences: UserPreferences }>('/users/me/settings', data);
  }

  /**
   * 绑定手机号
   */
  async bindPhone(phoneNumber: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/users/me/bind-phone', { phoneNumber });
  }

  /**
   * 获取用户的团队列表
   */
  async getTeams(): Promise<Array<{
    id: string;
    name: string;
    role: string;
    isActive: boolean;
  }>> {
    return this.get('/users/teams');
  }

  /**
   * 获取用户统计信息
   */
  async getStatistics(): Promise<{
    tasksCreated: number;
    tasksCompleted: number;
    successRate: number;
    activeWorkflows: number;
    agentsCount: number;
    operatorsCount: number;
    teamsCount: number;
    knowledgeBasesCount: number;
  }> {
    return this.get('/users/statistics');
  }

  /**
   * Public profile for a user in the caller's active team (no password).
   */
  async getPublicProfile(userId: string): Promise<PublicUserProfile | null> {
    try {
      const res = await this.get<PublicUserProfile>(`/users/profiles/${encodeURIComponent(userId)}`);
      return unwrapData<PublicUserProfile>(res);
    } catch {
      return null;
    }
  }

  /**
   * Batch public profiles for user ids in the caller's active team.
   */
  async getPublicProfiles(userIds: string[]): Promise<PublicUserProfile[]> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (!unique.length) return [];
    const res = await this.post<{ profiles: PublicUserProfile[] }>('/users/profiles/batch', {
      userIds: unique,
    });
    const data = unwrapData<{ profiles: PublicUserProfile[] }>(res);
    return data?.profiles ?? [];
  }
}
