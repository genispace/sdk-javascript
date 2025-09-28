import { BaseClient } from '../client/base';
import { 
  Task, 
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
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<Task> {
    return this.get<Task>(`/tasks/${taskId}`);
  }

  /**
   * 执行任务
   */
  async execute(taskId: string, inputs?: Record<string, any>): Promise<any> {
    const url = `/tasks/${taskId}/execute`;
    return this.post(url, inputs || {});
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
   * 取消任务执行
   */
  async cancelExecution(executionId: string): Promise<void> {
    return this.post(`/tasks/runs/${executionId}/cancel`);
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
}
