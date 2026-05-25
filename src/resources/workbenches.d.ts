import { BaseClient } from '../client/base';
import { Workbench, WorkbenchOverview, CreateWorkbenchRequest, UpdateWorkbenchRequest, WorkbenchVersion } from '../types';
/**
 * 工作台资源（`/workbenches`）
 */
export declare class Workbenches extends BaseClient {
    /**
     * 获取工作台列表
     */
    list(params?: {
        page?: number;
        limit?: number;
        status?: string;
        isActive?: boolean;
    }): Promise<{
        items: Workbench[];
    }>;
    /**
     * 获取工作台详情
     */
    getWorkbench(workbenchId: string): Promise<Workbench>;
    /**
     * 获取工作台概览（`GET /workbenches/:id/overview`）
     */
    getOverview(workbenchId: string): Promise<WorkbenchOverview>;
    /**
     * 创建工作台
     */
    create(data: CreateWorkbenchRequest): Promise<Workbench>;
    /**
     * 更新工作台
     */
    updateWorkbench(workbenchId: string, data: UpdateWorkbenchRequest): Promise<Workbench>;
    /**
     * 删除工作台
     */
    deleteWorkbench(workbenchId: string): Promise<void>;
    /**
     * 切换工作台激活状态（`PATCH /workbenches/:id/active`）
     */
    setActive(workbenchId: string, isActive: boolean): Promise<Workbench | undefined>;
    /**
     * 获取版本历史
     */
    listVersions(workbenchId: string): Promise<WorkbenchVersion[]>;
    /**
     * 按版本记录 ID 恢复（`POST /workbenches/:id/versions/:versionId/restore`）
     */
    restoreVersion(workbenchId: string, versionId: string): Promise<Workbench>;
    /**
     * 按版本号恢复（`POST /workbenches/:id/restore/:version`）
     */
    restoreSnapshot(workbenchId: string, version: string): Promise<Workbench>;
}
