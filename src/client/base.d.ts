import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { GeniSpaceConfig } from '../types';
/**
 * GeniSpace API 基础客户端
 */
export declare class BaseClient {
    protected http: AxiosInstance;
    protected config: GeniSpaceConfig;
    constructor(config: GeniSpaceConfig);
    /**
     * 设置请求和响应拦截器
     */
    private setupInterceptors;
    /**
     * 通用 GET 请求
     */
    protected get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 通用 POST 请求
     */
    protected post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 无认证的 POST 请求（用于验证API Key等公开接口）
     */
    protected postWithoutAuth<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 通用 PUT 请求
     */
    protected put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 通用 DELETE 请求
     */
    protected delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 通用 PATCH 请求
     */
    protected patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 原始请求方法（用于特殊情况）
     */
    protected request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    /**
     * 更新 API Key
     */
    updateApiKey(apiKey: string): void;
    /**
     * 设置 OAuth / 会话 access token（优先于 API Key 作为 Authorization，用于 GeniApp 等浏览器场景）
     */
    updateAccessToken(accessToken: string | undefined): void;
    /**
     * 更新基础URL
     */
    updateBaseURL(baseURL: string): void;
}
