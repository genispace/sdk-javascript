import { BaseClient } from '../client/base';
import { 
  User, 
  UserPreferences, 
  UpdatePasswordRequest
} from '../types';

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
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences> {
    return this.get<UserPreferences>('/users/me/preferences');
  }

  /**
   * 更新偏好设置
   */
  async updatePreferences(data: UserPreferences): Promise<UserPreferences> {
    return this.put<UserPreferences>('/users/me/preferences', data);
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
}
