import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { GeniSpaceResponse, GeniSpaceConfig, GeniSpaceError } from '../types';

/**
 * GeniSpace API 基础客户端
 */
export class BaseClient {
  protected http: AxiosInstance;
  protected config: GeniSpaceConfig;

  constructor(config: GeniSpaceConfig) {
    this.config = {
      baseURL: 'https://api.genispace.com',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'GeniSpace-SDK-JS/1.0.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.http.interceptors.request.use(
      (config) => {
        // 可以在这里添加请求日志
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.http.interceptors.response.use(
      (response: AxiosResponse<GeniSpaceResponse>) => {
        return response;
      },
      async (error) => {
        const { config, response } = error;

        // 如果是网络错误且配置了重试
        if (!response && this.config.retries && config.__retryCount < this.config.retries) {
          config.__retryCount = config.__retryCount || 0;
          config.__retryCount += 1;

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          return this.http(config);
        }

        // 转换为 GeniSpaceError
        const message = response?.data?.error || error.message || '请求失败';
        const code = response?.data?.code || 'UNKNOWN_ERROR';
        const statusCode = response?.status;

        throw new GeniSpaceError(message, code, statusCode);
      }
    );
  }

  /**
   * 通用 GET 请求
   */
  protected async get<T = any>(
    url: string, 
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.http.get<GeniSpaceResponse<T>>(url, {
      params,
      ...config
    });
    
    // 检查是否有明确的失败标识
    const hasSuccess = 'success' in response.data;
    
    if (hasSuccess && !response.data.success) {
      throw new GeniSpaceError(
        response.data.error || '请求失败',
        response.data.code
      );
    }

    // 返回标准化响应格式，支持不同的API响应格式
    if (hasSuccess) {
      // 标准API响应格式
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        code: response.data.code,
        message: response.data.message,
        timestamp: response.data.timestamp || new Date().toISOString()
      } as any;
    } else {
      // 直接数据响应格式
      return response.data as any;
    }
  }

  /**
   * 通用 POST 请求
   */
  protected async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.http.post<GeniSpaceResponse<T>>(url, data, config);
      
      // 检查是否有明确的失败标识
      const hasSuccess = 'success' in response.data;
      
      if (hasSuccess && !response.data.success) {
        const error = new GeniSpaceError(
          response.data.error || '请求失败',
          response.data.code
        );
        // 附加额外错误信息用于调试
        (error as any).statusCode = response.status;
        (error as any).responseData = response.data;
        throw error;
      }

      // 返回标准化响应格式，支持不同的API响应格式
      if (hasSuccess) {
        // 标准API响应格式
        return {
          success: response.data.success,
          data: response.data.data,
          error: response.data.error,
          code: response.data.code,
          message: response.data.message,
          timestamp: response.data.timestamp || new Date().toISOString()
        } as any;
      } else {
        // 直接数据响应格式（如创建智能体返回的格式）
        return response.data as any;
      }
    } catch (error: any) {
      if (error instanceof GeniSpaceError) {
        throw error;
      }
      
      // Axios错误处理
      if (error.response) {
        const geniSpaceError = new GeniSpaceError(
          error.response.data?.error || error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`,
          error.response.data?.code || `HTTP_${error.response.status}`
        );
        (geniSpaceError as any).statusCode = error.response.status;
        (geniSpaceError as any).responseData = error.response.data;
        throw geniSpaceError;
      } else if (error.request) {
        throw new GeniSpaceError('网络请求失败', 'NETWORK_ERROR');
      } else {
        throw new GeniSpaceError(error.message || '未知错误', 'UNKNOWN_ERROR');
      }
    }
  }

  /**
   * 无认证的 POST 请求（用于验证API Key等公开接口）
   */
  protected async postWithoutAuth<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    // 创建一个不带认证头的axios实例
    const httpWithoutAuth = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GeniSpace-SDK-JS/1.0.0',
        ...config?.headers
      },
      // 对于验证接口，不要因为HTTP 401而抛出错误
      validateStatus: (status) => {
        if (url.includes('/validate/')) {
          return status >= 200 && status < 500; // 接受200-499范围的状态码
        }
        return status >= 200 && status < 300; // 其他接口保持默认行为
      }
    });

    const response = await httpWithoutAuth.post<GeniSpaceResponse<T>>(url, data, config);
    
    // 对于验证接口，总是返回响应数据（无论成功还是失败）
    if (url.includes('/validate/')) {
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        code: response.data.code,
        message: response.data.message,
        timestamp: response.data.timestamp || new Date().toISOString()
      } as any;
    }
    
    if (!response.data.success) {
      throw new GeniSpaceError(
        response.data.error || '请求失败',
        response.data.code
      );
    }

    // 返回标准化响应格式，保持平台API的完整响应结构
    return {
      success: response.data.success,
      data: response.data.data,
      error: response.data.error,
      code: response.data.code,
      message: response.data.message,
      timestamp: response.data.timestamp || new Date().toISOString()
    } as any;
  }

  /**
   * 通用 PUT 请求
   */
  protected async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.http.put<GeniSpaceResponse<T>>(url, data, config);
    
    if (!response.data.success) {
      throw new GeniSpaceError(
        response.data.error || '请求失败',
        response.data.code
      );
    }

    // 返回标准化响应格式，保持平台API的完整响应结构
    return {
      success: response.data.success,
      data: response.data.data,
      error: response.data.error,
      code: response.data.code,
      message: response.data.message,
      timestamp: response.data.timestamp || new Date().toISOString()
    } as any;
  }

  /**
   * 通用 DELETE 请求
   */
  protected async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.http.delete<GeniSpaceResponse<T>>(url, config);
    
    if (!response.data.success) {
      throw new GeniSpaceError(
        response.data.error || '请求失败',
        response.data.code
      );
    }

    // 返回标准化响应格式，保持平台API的完整响应结构
    return {
      success: response.data.success,
      data: response.data.data,
      error: response.data.error,
      code: response.data.code,
      message: response.data.message,
      timestamp: response.data.timestamp || new Date().toISOString()
    } as any;
  }

  /**
   * 通用 PATCH 请求
   */
  protected async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.http.patch<GeniSpaceResponse<T>>(url, data, config);
    
    if (!response.data.success) {
      throw new GeniSpaceError(
        response.data.error || '请求失败',
        response.data.code
      );
    }

    // 返回标准化响应格式，保持平台API的完整响应结构
    return {
      success: response.data.success,
      data: response.data.data,
      error: response.data.error,
      code: response.data.code,
      message: response.data.message,
      timestamp: response.data.timestamp || new Date().toISOString()
    } as any;
  }

  /**
   * 原始请求方法（用于特殊情况）
   */
  protected async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.http.request<T>(config);
  }

  /**
   * 更新 API Key
   */
  public updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.http.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * 更新基础URL
   */
  public updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.http.defaults.baseURL = baseURL;
  }
}
