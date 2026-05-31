import { BaseClient, isBrowserEnvironment } from '../client/base';
import { 
  PaginationParams,
  GeniSpacePaginationResponse 
} from '../types';

/**
 * 存储文件类型
 */
export interface StorageFile {
  id: string;
  name: string;
  originalName?: string;
  folderId?: string;
  path: string;
  url: string;
  publicUrl?: string;
  mimeType: string;
  size: number;
  hash?: string;
  metadata?: Record<string, any>;
  folder?: {
    id: string;
    name: string;
    path: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 存储文件夹类型
 */
export interface StorageFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  _count?: {
    files: number;
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 文件列表响应
 */
export interface FileListResponse {
  items: StorageFile[];
  pagination: GeniSpacePaginationResponse;
}

/**
 * Detect File/Blob across Vite prebundle / iframe realm boundaries (`instanceof` alone may fail).
 */
function isBrowserUploadFile(file: unknown): file is Blob {
  if (!file || typeof file !== 'object') return false;
  const tag = Object.prototype.toString.call(file);
  if (tag === '[object File]' || tag === '[object Blob]') return true;
  if (typeof Blob !== 'undefined' && file instanceof Blob) return true;
  return false;
}

/**
 * 存储管理资源
 */
export class Storage extends BaseClient {
  
  /**
   * 上传文件
   * @param file - 文件对象（Node.js 环境）或 File 对象（浏览器环境）
   * @param folderId - 文件夹ID（可选）
   * @param folderPath - 文件夹路径（可选，如果不存在会自动创建）
   * @returns 上传结果
   */
  async uploadFile(
    file: any,
    options?: {
      folderId?: string;
      folderPath?: string;
      fileName?: string;
    }
  ): Promise<StorageFile> {
    if (isBrowserEnvironment()) {
      if (!isBrowserUploadFile(file)) {
        throw new Error('Invalid file object');
      }
      const browserForm = new FormData();
      const fileName =
        options?.fileName ||
        (Object.prototype.toString.call(file) === '[object File]'
          ? (file as File).name
          : 'file');
      browserForm.append('file', file, fileName);
      if (options?.folderId) {
        browserForm.append('folderId', options.folderId);
      }
      if (options?.folderPath) {
        browserForm.append('path', options.folderPath);
      }
      const response = await this.post<{ data: StorageFile }>(
        '/storage/files/upload',
        browserForm,
        {
          timeout: 300000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      return (response as any).data || (response as any);
    }

    const NodeFormData = require('form-data');
    const formData = new NodeFormData();

    // 处理文件对象
    if (file && typeof file === 'object') {
      // Node.js 环境：可能是文件路径或流
      if (file.path) {
        const fs = require('fs');
        const path = require('path');
        const fileName = options?.fileName || path.basename(file.path);
        formData.append('file', fs.createReadStream(file.path), {
          filename: fileName
        });
      } else if (file.buffer) {
        // Buffer 对象
        formData.append('file', file.buffer, {
          filename: options?.fileName || file.originalname || 'file',
          contentType: file.mimetype || 'application/octet-stream'
        });
      } else {
        // 流对象
        formData.append('file', file, {
          filename: options?.fileName || 'file'
        });
      }
    } else {
      throw new Error('无效的文件对象');
    }

    // 添加文件夹参数
    if (options?.folderId) {
      formData.append('folderId', options.folderId);
    }
    if (options?.folderPath) {
      formData.append('path', options.folderPath);
    }

    const response = await this.post<{ data: StorageFile }>('/storage/files/upload', formData, {
      headers: formData.getHeaders(),
      timeout: 300000, // 5分钟超时，支持大文件上传
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return (response as any).data || response as any;
  }

  /**
   * 获取文件列表
   * @param params - 查询参数
   * @returns 文件列表
   */
  async listFiles(params?: PaginationParams & {
    folderId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<FileListResponse> {
    const response = await this.get<{ data: FileListResponse }>('/storage/files', params);
    // 处理响应格式：可能是 { success: true, data: { items: [], pagination: {} } } 或直接 { items: [], pagination: {} }
    return (response as any).data || response as any;
  }

  /**
   * 获取文件信息
   * @param fileId - 文件ID
   * @returns 文件信息
   */
  async getFile(fileId: string): Promise<StorageFile> {
    const response = await this.get<{ data: StorageFile }>(`/storage/files/${fileId}`);
    return (response as { data?: StorageFile }).data ?? (response as unknown as StorageFile);
  }

  /**
   * 获取文件内容（用于私有存储桶）
   * @param fileId - 文件ID
   * @returns 文件二进制（浏览器为 ArrayBuffer，Node 为 Buffer）
   */
  async getFileContent(fileId: string): Promise<ArrayBuffer | Buffer> {
    const response = await this.request<ArrayBuffer>({
      method: 'GET',
      url: `/storage/files/${fileId}/content`,
      responseType: 'arraybuffer',
    });
    const data = response.data;
    if (!isBrowserEnvironment() && typeof Buffer !== 'undefined') {
      return Buffer.from(data);
    }
    return data;
  }

  /**
   * 删除文件
   * @param fileId - 文件ID
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.delete(`/storage/files/${fileId}`);
  }

  /**
   * 批量删除文件
   * @param fileIds - 文件ID数组
   * @returns 删除结果
   */
  async deleteFiles(fileIds: string[]): Promise<{
    results: Array<{
      success: boolean;
      fileId: string;
      error?: string;
    }>;
  }> {
    const response = await this.post('/storage/files/batch-delete', { fileIds });
    return response.data || response as any;
  }

  /**
   * 重命名文件
   * @param fileId - 文件ID
   * @param name - 新文件名
   */
  async renameFile(fileId: string, name: string): Promise<void> {
    await this.patch(`/storage/files/${fileId}/rename`, { name });
  }

  /**
   * 移动文件
   * @param fileId - 文件ID
   * @param folderId - 目标文件夹ID（null 表示根目录）
   */
  async moveFile(fileId: string, folderId: string | null): Promise<void> {
    await this.patch(`/storage/files/${fileId}/move`, { folderId });
  }

  /**
   * 创建文件夹
   * @param name - 文件夹名称
   * @param parentId - 父文件夹ID（可选）
   * @returns 创建的文件夹信息
   */
  async createFolder(name: string, parentId?: string): Promise<StorageFolder> {
    const response = await this.post<{ data: StorageFolder }>('/storage/folders', {
      name,
      parentId
    });
    return (response as any).data || response as any;
  }

  /**
   * 获取文件夹列表
   * @param parentId - 父文件夹ID（可选，null 表示根目录）
   * @returns 文件夹列表
   */
  async listFolders(parentId?: string | null): Promise<StorageFolder[]> {
    const response = await this.get<{ data: StorageFolder[] }>('/storage/folders', {
      parentId: parentId || null
    });
    return Array.isArray((response as any).data) ? (response as any).data : (Array.isArray(response) ? response : []);
  }

  /**
   * 重命名文件夹
   * @param folderId - 文件夹ID
   * @param name - 新文件夹名称
   */
  async renameFolder(folderId: string, name: string): Promise<void> {
    await this.patch(`/storage/folders/${folderId}/rename`, { name });
  }

  /**
   * 删除文件夹
   * @param folderId - 文件夹ID
   */
  async deleteFolder(folderId: string): Promise<void> {
    await this.delete(`/storage/folders/${folderId}`);
  }

  /**
   * 批量删除项目（支持文件和文件夹）
   * @param items - 要删除的项目数组
   * @returns 删除结果
   */
  async batchDelete(items: Array<{
    id: string;
    type: 'file' | 'folder';
  }>): Promise<{
    results: Array<{
      success: boolean;
      id: string;
      type: 'file' | 'folder';
      error?: string;
    }>;
    summary: {
      total: number;
      success: number;
      failed: number;
    };
  }> {
    const response = await this.post('/storage/batch-delete', { items });
    return response.data || response as any;
  }

  /**
   * 获取存储统计信息
   * @returns 统计信息
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    folderCount: number;
    filesByType: Array<{
      type: string;
      label: string;
      count: number;
      size: number;
    }>;
  }> {
    const response = await this.get('/storage/stats');
    return response.data || response as any;
  }

  /**
   * 搜索文件和文件夹
   * @param query - 搜索关键词
   * @param params - 分页参数
   * @returns 搜索结果
   */
  async searchFiles(
    query: string,
    params?: PaginationParams
  ): Promise<{
    folders: StorageFolder[];
    files: StorageFile[];
    pagination: GeniSpacePaginationResponse & {
      folderCount: number;
      fileCount: number;
    };
  }> {
    const response = await this.get('/storage/search', {
      query,
      ...params
    });
    return response.data || response as any;
  }
}

