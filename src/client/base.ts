import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { GeniSpaceResponse, GeniSpaceConfig, GeniSpaceError } from '../types';

function bearerFromConfig(config: GeniSpaceConfig): string {
  const c = config as GeniSpaceConfig & { accessToken?: string };
  return c.accessToken ?? config.apiKey;
}

/** True when `document` exists (browser). SDK `lib` has no DOM types — use `globalThis`, not `window`. */
export function isBrowserEnvironment(): boolean {
  return typeof (globalThis as { document?: unknown }).document !== 'undefined';
}

function isFormDataLike(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  return Object.prototype.toString.call(data) === '[object FormData]';
}

/** Browsers refuse `User-Agent` on XHR/fetch (axios uses XHR in the browser). Keep it for Node. */
function sdkDefaultHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!isBrowserEnvironment()) {
    h['User-Agent'] = 'GeniSpace-SDK-JS/1.0.0';
  }
  return h;
}

/**
 * GeniSpace API 基础客户端
 */
export class BaseClient {
  protected http: AxiosInstance;
  protected config: GeniSpaceConfig;

  constructor(config: GeniSpaceConfig) {
    this.config = {
      baseURL: 'https://api.genispace.ai',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        ...sdkDefaultHeaders(),
        Authorization: `Bearer ${bearerFromConfig(this.config)}`,
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器：每次请求刷新 Authorization（支持运行时切换 accessToken / apiKey）
    this.http.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        const token = bearerFromConfig(this.config);
        if (reqConfig.headers) {
          (reqConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
        if (isFormDataLike(reqConfig.data) && reqConfig.headers) {
          delete (reqConfig.headers as Record<string, unknown>)['Content-Type'];
        }
        return reqConfig;
      },
      (error: unknown) => Promise.reject(error)
    );

    // 响应拦截器
    this.http.interceptors.response.use(
      (response: AxiosResponse<GeniSpaceResponse>) => {
        return response;
      },
      async (error: any) => {
        const config = error?.config as InternalAxiosRequestConfig & { __retryCount?: number } | undefined;
        const response = error?.response;

        // 网络错误重试（须存在 axios request config；取消/非 axios 错误常无 config）
        const retries = this.config.retries ?? 0;
        if (config && !response && retries > 0) {
          const attempt = Number(config.__retryCount) || 0;
          if (attempt < retries) {
            config.__retryCount = attempt + 1;
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            return this.http(config);
          }
        }

        // 转换为 GeniSpaceError（平台错误体常用 message）
        const data = response?.data as Record<string, unknown> | undefined;
        const message =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          error.message ||
          '请求失败';
        const code = (typeof data?.code === 'string' && data.code) || 'UNKNOWN_ERROR';
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
   * POST where successful responses return the full response JSON body (flat shape),
   * e.g. `POST /operators/execute` returns `{ success, result, operator, executionTime, ... }` without a nested `data` field.
   * Reuses the same axios instance, auth headers, retries on the error interceptor, and GeniSpaceError mapping.
   */
  protected async postJsonBody<T extends Record<string, unknown>>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.http.post(url, body, config);
      const payload = response.data as Record<string, unknown> | null | undefined;

      if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
        const error = new GeniSpaceError(
          (typeof payload.error === 'string' && payload.error) ||
            (typeof payload.message === 'string' && payload.message) ||
            '请求失败',
          typeof payload.code === 'string' ? payload.code : undefined,
          response.status
        );
        (error as any).responseData = payload;
        throw error;
      }

      return (payload ?? {}) as T;
    } catch (error: unknown) {
      if (error instanceof GeniSpaceError) {
        throw error;
      }

      const err = error as {
        response?: { status?: number; data?: { error?: string; message?: string; code?: string } };
        request?: unknown;
        message?: string;
      };

      if (err.response) {
        const d = err.response.data;
        const geniSpaceError = new GeniSpaceError(
          (typeof d?.error === 'string' && d.error) ||
            (typeof d?.message === 'string' && d.message) ||
            `HTTP ${err.response.status}: request failed`,
          (typeof d?.code === 'string' && d.code) ||
            (err.response.status != null ? `HTTP_${err.response.status}` : 'HTTP_ERROR'),
          err.response.status
        );
        (geniSpaceError as any).responseData = d;
        throw geniSpaceError;
      }

      if (err.request) {
        throw new GeniSpaceError('网络请求失败', 'NETWORK_ERROR');
      }

      throw new GeniSpaceError(err.message || '未知错误', 'UNKNOWN_ERROR');
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
        ...sdkDefaultHeaders(),
        ...config?.headers,
      },
      // 对于验证接口，不要因为HTTP 401而抛出错误
      validateStatus: (status: number) => {
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
    const body = response.data as GeniSpaceResponse<T> | '' | null | undefined;

    if (body == null || body === '') {
      return { success: true } as T;
    }

    if (typeof body === 'object' && 'success' in body && !body.success) {
      throw new GeniSpaceError(
        (body as GeniSpaceResponse).message || (body as GeniSpaceResponse).error || '请求失败',
        (body as GeniSpaceResponse).code
      );
    }

    if (typeof body === 'object' && 'success' in body) {
      return {
        success: body.success,
        data: body.data,
        error: body.error,
        code: body.code,
        message: body.message,
        timestamp: body.timestamp || new Date().toISOString()
      } as any;
    }

    return body as any;
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
    this.http.defaults.headers['Authorization'] = `Bearer ${bearerFromConfig(this.config)}`;
  }

  /**
   * 设置 OAuth / 会话 access token（优先于 API Key 作为 Authorization，用于 GeniApp 等浏览器场景）
   */
  public updateAccessToken(accessToken: string | undefined): void {
    (this.config as GeniSpaceConfig & { accessToken?: string }).accessToken = accessToken;
    this.http.defaults.headers['Authorization'] = `Bearer ${bearerFromConfig(this.config)}`;
  }

  /**
   * 更新基础URL
   */
  public updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.http.defaults.baseURL = baseURL;
  }
}
