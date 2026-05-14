import { BaseClient } from '../client/base';
import {
  GeniSpaceError,
  Workbench,
  CreateWorkbenchRequest,
  UpdateWorkbenchRequest,
  WorkbenchVersion,
} from '../types';

function encodeId(id: string): string {
  return encodeURIComponent(id);
}

/**
 * 工作台资源（`/workbenches`）。部分列表接口响应使用 `items` 字段，在此直接用 HTTP 客户端解析以保持与平台一致。
 */
export class Workbenches extends BaseClient {
  /**
   * 获取工作台列表
   */
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    isActive?: boolean;
  }): Promise<{ items: Workbench[] }> {
    const res = await this.http.get<
      | { success?: boolean; items?: Workbench[]; message?: string; code?: string }
      | Workbench[]
    >('/workbenches', { params });
    const body = res.data;

    if (Array.isArray(body)) {
      return { items: body };
    }

    if (typeof body === 'object' && body !== null && 'success' in body && body.success === false) {
      throw new GeniSpaceError(
        (body as { message?: string }).message || '获取工作台列表失败',
        (body as { code?: string }).code
      );
    }

    const items = (body as { items?: Workbench[] }).items;
    return { items: Array.isArray(items) ? items : [] };
  }

  /**
   * 获取工作台详情
   */
  async getWorkbench(workbenchId: string): Promise<Workbench> {
    const res = await this.http.get<{
      success?: boolean;
      data?: Workbench;
      message?: string;
      code?: string;
    }>(`/workbenches/${encodeId(workbenchId)}`);
    const body = res.data;

    if (typeof body === 'object' && body !== null && 'success' in body && body.success === false) {
      throw new GeniSpaceError(body.message || '获取工作台详情失败', body.code);
    }

    if (body && typeof body === 'object' && 'data' in body && body.data) {
      return body.data;
    }

    throw new GeniSpaceError('响应缺少工作台数据', 'INVALID_RESPONSE');
  }

  /**
   * 创建工作台
   */
  async create(data: CreateWorkbenchRequest): Promise<Workbench> {
    const res = await this.http.post<Record<string, unknown>>('/workbenches', data);
    return this.parseWorkbenchBody(res.data, '创建工作台失败');
  }

  /**
   * 更新工作台
   */
  async updateWorkbench(workbenchId: string, data: UpdateWorkbenchRequest): Promise<Workbench> {
    const res = await this.http.put<Record<string, unknown>>(`/workbenches/${encodeId(workbenchId)}`, data);
    return this.parseWorkbenchBody(res.data, '更新工作台失败');
  }

  /**
   * 删除工作台
   */
  async deleteWorkbench(workbenchId: string): Promise<void> {
    await this.delete(`/workbenches/${encodeId(workbenchId)}`);
  }

  /**
   * 切换工作台激活状态（`PATCH /workbenches/:id/active`）
   */
  async setActive(workbenchId: string, isActive: boolean): Promise<Workbench | undefined> {
    const res = await this.http.patch<{
      success?: boolean;
      data?: Workbench;
      message?: string;
      code?: string;
    }>(`/workbenches/${encodeId(workbenchId)}/active`, { isActive });
    const body = res.data;

    if (typeof body === 'object' && body !== null && body.success === false) {
      throw new GeniSpaceError(body.message || '切换工作台激活状态失败', body.code);
    }

    return body?.data;
  }

  /**
   * 获取版本历史
   */
  async listVersions(workbenchId: string): Promise<WorkbenchVersion[]> {
    const res = await this.http.get<{
      success?: boolean;
      items?: WorkbenchVersion[];
      message?: string;
      code?: string;
    }>(`/workbenches/${encodeId(workbenchId)}/versions`);
    const body = res.data;

    if (typeof body === 'object' && body !== null && 'success' in body && body.success === false) {
      throw new GeniSpaceError(body.message || '获取工作台版本列表失败', body.code);
    }

    const items = (body as { items?: WorkbenchVersion[] }).items;
    return Array.isArray(items) ? items : [];
  }

  /**
   * 按版本记录 ID 恢复（`POST /workbenches/:id/versions/:versionId/restore`）
   */
  async restoreVersion(workbenchId: string, versionId: string): Promise<Workbench> {
    const res = await this.http.post<Record<string, unknown>>(
      `/workbenches/${encodeId(workbenchId)}/versions/${encodeId(versionId)}/restore`,
      {}
    );
    return this.parseWorkbenchBody(res.data, '恢复工作台版本失败');
  }

  /**
   * 按版本号恢复（`POST /workbenches/:id/restore/:version`，与控制台部分流程一致）
   */
  async restoreSnapshot(workbenchId: string, version: string): Promise<Workbench> {
    const res = await this.http.post<Record<string, unknown>>(
      `/workbenches/${encodeId(workbenchId)}/restore/${encodeId(version)}`,
      {}
    );
    return this.parseWorkbenchBody(res.data, '按版本号恢复工作台失败');
  }

  private parseWorkbenchBody(body: Record<string, unknown>, failureMessage: string): Workbench {
    if ('success' in body && body.success === false) {
      throw new GeniSpaceError(
        (typeof body.message === 'string' && body.message) || failureMessage,
        typeof body.code === 'string' ? body.code : undefined
      );
    }

    if ('data' in body && body.data && typeof body.data === 'object' && body.data !== null) {
      return body.data as Workbench;
    }

    if ('id' in body && typeof (body as { id?: unknown }).id === 'string') {
      return body as unknown as Workbench;
    }

    throw new GeniSpaceError(failureMessage, 'INVALID_RESPONSE');
  }
}
