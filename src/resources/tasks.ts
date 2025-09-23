import { BaseClient } from '../client/base';
import { 
  Task, 
  CreateTaskRequest, 
  TaskExecution,
  PaginationParams,
  GeniSpacePaginationResponse 
} from '../types';

/**
 * 任务管理资源
 */
export class Tasks extends BaseClient {
  
  /**
   * 获取任务列表
   */
  async list(params?: PaginationParams & {
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    userId?: string;
    type?: 'SCHEDULED' | 'EVENT' | 'MANUAL';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    all?: boolean;
  }): Promise<{
    data: Task[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get('/tasks', params);
  }

  /**
   * 创建任务
   */
  async create(data: CreateTaskRequest): Promise<Task> {
    return this.post<Task>('/tasks', data);
  }

  /**
   * 获取任务执行记录列表
   */
  async getExecutions(params?: PaginationParams & {
    taskId?: string;
    userId?: string;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
  }): Promise<{
    data: TaskExecution[];
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get('/tasks/executes', params);
  }

  /**
   * 获取任务统计信息
   */
  async getStatistics(): Promise<{
    totalTasks: {
      count: number;
      growth: number;
      period: string;
    };
    activeTasks: {
      count: number;
      growth: number;
      period: string;
    };
    successRate: {
      value: number;
      change: number;
      unit: string;
    };
    avgCompletionTime: {
      formatted: string;
      raw: number;
      change: number;
      slower: boolean;
    };
  }> {
    return this.get('/tasks/statistics');
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<Task> {
    return this.get<Task>(`/tasks/${taskId}`);
  }

  /**
   * 更新任务
   */
  async update(taskId: string, data: Partial<CreateTaskRequest & {
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    startDate: string | null;
    endDate: string | null;
    tags: string[];
    webhookSecret: string;
    webhookUrl: string;
  }>): Promise<Task> {
    return this.put<Task>(`/tasks/${taskId}`, data);
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void> {
    return this.delete(`/tasks/${taskId}`);
  }

  /**
   * 调度任务
   */
  async schedule(taskId: string): Promise<any> {
    return this.post(`/tasks/${taskId}/schedule`);
  }

  /**
   * 执行任务
   */
  async execute(taskId: string, mode?: 'sync' | 'async'): Promise<any> {
    return this.post(`/tasks/${taskId}/execute`, undefined, {
      params: { mode }
    });
  }

  /**
   * 获取任务日志
   */
  async getLogs(taskId: string): Promise<any> {
    return this.get(`/tasks/${taskId}/logs`);
  }

  /**
   * 导入任务配置
   */
  async import(taskJson: Record<string, any>): Promise<Task> {
    return this.post<Task>('/tasks/import', { taskJson });
  }

  /**
   * 导出任务配置
   */
  async export(taskId: string): Promise<any> {
    return this.get(`/tasks/${taskId}/export`);
  }

  /**
   * 获取任务执行详情
   */
  async getExecution(executionId: string): Promise<TaskExecution> {
    return this.get<TaskExecution>(`/tasks/executions/${executionId}`);
  }

  /**
   * 获取任务输入输出参数定义
   */
  async getSchema(taskId: string): Promise<{
    id: string;
    name: string;
    description: string;
    type: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  }> {
    return this.get(`/tasks/${taskId}/schema`);
  }

  /**
   * 上传文件到云存储
   */
  async uploadFile(file: File, fieldId: string): Promise<{
    url: string;
    fieldId: string;
    filename: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldId', fieldId);

    return this.post('/tasks/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 获取任务执行状态和日志
   */
  async getRunStatus(taskExecutionId: string): Promise<{
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    startTime?: string;
    endTime?: string;
    duration?: number;
    logs: Array<{
      id: string;
      level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
      message: string;
      timestamp: string;
      metadata?: Record<string, any>;
    }>;
    task: {
      id: string;
      name: string;
      type: string;
    };
  }> {
    return this.get(`/tasks/runs/${taskExecutionId}`);
  }

  /**
   * 添加任务执行日志
   */
  async addExecutionLog(executionId: string, data: {
    level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
    message: string;
    nodeId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    return this.post(`/tasks/executions/${executionId}/logs`, data);
  }

  /**
   * 取消任务执行
   */
  async cancelExecution(executionId: string): Promise<void> {
    return this.post(`/tasks/runs/${executionId}/cancel`);
  }

  /**
   * 更新任务执行记录
   */
  async updateExecution(executionId: string, data: {
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    currentNodeId?: string;
    logs?: Array<{
      level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
      message: string;
      metadata?: Record<string, any>;
    }>;
    outputs?: Record<string, any>;
    errors?: Array<{
      message: string;
      stack?: string;
      code?: string;
    }>;
    endTime?: string;
  }): Promise<void> {
    return this.post(`/tasks/executions/${executionId}/update`, data);
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(taskId: string): Promise<{
    totalRuns: number;
    successRate: string;
    avgDuration: string;
    recentRuns: Array<{
      id: string;
      status: 'COMPLETED' | 'FAILED';
      startTime: string;
      endTime: string;
      duration: number;
      error?: string;
    }>;
  }> {
    return this.get(`/tasks/${taskId}/stats`);
  }

  /**
   * 分页获取任务执行日志
   */
  async getExecutionLogsPaginated(executionId: string, params?: PaginationParams & {
    level?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
    search?: string;
    nodeId?: string;
  }): Promise<{
    data: Array<{
      id: string;
      level: string;
      message: string;
      timestamp: string;
      nodeId?: string;
      metadata?: Record<string, any>;
    }>;
    pagination: GeniSpacePaginationResponse;
  }> {
    return this.get(`/tasks/executions/${executionId}/logs/paginated`, params);
  }

  /**
   * 导出任务执行日志
   */
  async exportExecutionLogs(executionId: string, params?: {
    level?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
    search?: string;
    nodeId?: string;
  }): Promise<string> {
    const response = await this.request({
      url: `/tasks/executions/${executionId}/logs/export`,
      method: 'GET',
      params,
      responseType: 'text'
    });
    return response.data;
  }

  /**
   * 获取任务可用的环境变量
   */
  async getEnvironmentVariables(taskId: string): Promise<{
    taskVariables: Array<{
      key: string;
      description?: string;
      isSecret: boolean;
      source: string;
    }>;
    configMapVariables: Array<{
      key: string;
      description?: string;
      isSecret: boolean;
      source: string;
      configMapName: string;
    }>;
  }> {
    return this.get(`/tasks/${taskId}/env-vars`);
  }

  /**
   * 根据智能体ID获取可用的任务列表
   */
  async getByAgentId(agentId: string): Promise<{
    data: Array<{
      id: string;
      name: string;
      description?: string;
      type: string;
    }>;
    strategy: 'all' | 'specific';
  }> {
    return this.get(`/tasks/agent/${agentId}`);
  }
}
