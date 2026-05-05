import { BaseClient } from '../client/base';
import { Task, TaskExecution, PaginationParams, GeniSpacePaginationResponse } from '../types';
/**
 * 任务管理资源
 */
export declare class Tasks extends BaseClient {
    /**
     * 获取任务列表
     */
    list(params?: PaginationParams & {
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
    }>;
    /**
     * 获取任务执行记录列表
     */
    getExecutions(params?: PaginationParams & {
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
    }>;
    /**
     * 获取任务详情
     */
    getTask(taskId: string): Promise<Task>;
    /**
     * 执行任务
     */
    execute(taskId: string, inputs?: Record<string, any>): Promise<any>;
    /**
     * 获取任务执行详情
     */
    getExecution(executionId: string): Promise<TaskExecution>;
    /**
     * 获取任务输入参数定义
     */
    getSchema(taskId: string): Promise<{
        id: string;
        name: string;
        description: string;
        type: string;
        inputs: Record<string, any>;
    }>;
    /**
     * 上传文件到云存储
     */
    uploadFile(file: File, fieldId: string): Promise<{
        url: string;
        fieldId: string;
        filename: string;
        size: number;
    }>;
    /**
     * 获取任务执行状态和日志
     */
    getRunStatus(taskExecutionId: string): Promise<{
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
    }>;
    /**
     * 取消任务执行
     */
    cancelExecution(executionId: string): Promise<void>;
    /**
     * 获取任务统计信息
     */
    getTaskStats(taskId: string): Promise<{
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
    }>;
    /**
     * 分页获取任务执行日志
     */
    getExecutionLogsPaginated(executionId: string, params?: PaginationParams & {
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
    }>;
}
