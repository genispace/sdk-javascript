import { BaseClient } from '../client/base';
import { PaginationParams, GeniSpacePaginationResponse } from '../types';
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
export interface StorageUploadGrant {
    id: string;
    applicationId: string;
    purpose: string;
    folderPath: string;
    fileName: string;
    mimeType: string;
    maxSize: number;
    expiresAt: string;
}
export interface CreateStorageUploadGrantInput {
    applicationId: string;
    permissionCode: string;
    purpose: string;
    fileName: string;
    mimeType: string;
    size: number;
}
export interface StorageFileAccessGrant {
    id: string;
    applicationId: string;
    fileId: string;
    url: string;
    expiresAt: string;
    disposition: 'inline' | 'download';
}
export interface CreateStorageFileAccessGrantInput {
    applicationId: string;
    fileId: string;
    permissionCode: string;
    disposition?: 'inline' | 'download';
}
export interface BindApplicationStorageFileInput {
    applicationId: string;
    permissionCode: string;
    visibility: 'private' | 'public';
    authorizedUserIds: string[];
}
/**
 * 存储管理资源
 */
export declare class Storage extends BaseClient {
    createUploadGrant(input: CreateStorageUploadGrantInput): Promise<StorageUploadGrant>;
    createFileAccessGrant(input: CreateStorageFileAccessGrantInput): Promise<StorageFileAccessGrant>;
    bindApplicationFile(fileId: string, input: BindApplicationStorageFileInput): Promise<{
        fileId: string;
        applicationId: string;
        visibility: 'private' | 'public';
        authorizedUserIds: string[];
    }>;
    /**
     * 上传文件
     * @param file - 文件对象（Node.js 环境）或 File 对象（浏览器环境）
     * @param folderId - 文件夹ID（可选）
     * @param folderPath - 文件夹路径（可选，如果不存在会自动创建）
     * @returns 上传结果
     */
    uploadFile(file: any, options?: {
        folderId?: string;
        folderPath?: string;
        fileName?: string;
        uploadGrantId?: string;
    }): Promise<StorageFile>;
    /**
     * 获取文件列表
     * @param params - 查询参数
     * @returns 文件列表
     */
    listFiles(params?: PaginationParams & {
        folderId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<FileListResponse>;
    /**
     * 获取文件信息
     * @param fileId - 文件ID
     * @returns 文件信息
     */
    getFile(fileId: string): Promise<StorageFile>;
    /**
     * 获取文件内容（用于私有存储桶）
     * @param fileId - 文件ID
     * @returns 文件二进制（浏览器 ArrayBuffer，Node Buffer）
     */
    getFileContent(fileId: string): Promise<ArrayBuffer | Buffer>;
    /**
     * 删除文件
     * @param fileId - 文件ID
     */
    deleteFile(fileId: string): Promise<void>;
    /**
     * 批量删除文件
     * @param fileIds - 文件ID数组
     * @returns 删除结果
     */
    deleteFiles(fileIds: string[]): Promise<{
        results: Array<{
            success: boolean;
            fileId: string;
            error?: string;
        }>;
    }>;
    /**
     * 重命名文件
     * @param fileId - 文件ID
     * @param name - 新文件名
     */
    renameFile(fileId: string, name: string): Promise<void>;
    /**
     * 移动文件
     * @param fileId - 文件ID
     * @param folderId - 目标文件夹ID（null 表示根目录）
     */
    moveFile(fileId: string, folderId: string | null): Promise<void>;
    /**
     * 创建文件夹
     * @param name - 文件夹名称
     * @param parentId - 父文件夹ID（可选）
     * @returns 创建的文件夹信息
     */
    createFolder(name: string, parentId?: string): Promise<StorageFolder>;
    /**
     * 获取文件夹列表
     * @param parentId - 父文件夹ID（可选，null 表示根目录）
     * @returns 文件夹列表
     */
    listFolders(parentId?: string | null): Promise<StorageFolder[]>;
    /**
     * 重命名文件夹
     * @param folderId - 文件夹ID
     * @param name - 新文件夹名称
     */
    renameFolder(folderId: string, name: string): Promise<void>;
    /**
     * 删除文件夹
     * @param folderId - 文件夹ID
     */
    deleteFolder(folderId: string): Promise<void>;
    /**
     * 批量删除项目（支持文件和文件夹）
     * @param items - 要删除的项目数组
     * @returns 删除结果
     */
    batchDelete(items: Array<{
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
    }>;
    /**
     * 获取存储统计信息
     * @returns 统计信息
     */
    getStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        folderCount: number;
        filesByType: Array<{
            type: string;
            label: string;
            count: number;
            size: number;
        }>;
    }>;
    /**
     * 搜索文件和文件夹
     * @param query - 搜索关键词
     * @param params - 分页参数
     * @returns 搜索结果
     */
    searchFiles(query: string, params?: PaginationParams): Promise<{
        folders: StorageFolder[];
        files: StorageFile[];
        pagination: GeniSpacePaginationResponse & {
            folderCount: number;
            fileCount: number;
        };
    }>;
}
