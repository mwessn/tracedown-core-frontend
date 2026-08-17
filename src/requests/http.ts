/**
 * Layer 1 — basic HTTP transport.
 *
 * Wraps a configured axios instance and normalizes every outcome into an
 * {@link ApiResponse}: success carries `data`, failure carries an `errorInfo`
 * whose message is resolved by the host. Navigation concerns (401 → login,
 * 404 → not-found) are delegated to host hooks, never handled here.
 */

import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios';
import type {
  ApiResponse,
  HttpMethod,
  RequestHost,
  RequestOptions,
} from '@/requests/types';

interface BackendErrorBody {
  error: string;
}

export interface Http<Code extends string> {
  get<T>(url: string, opts?: RequestOptions): Promise<ApiResponse<T, Code>>;
  post<T, B = unknown>(url: string, body?: B, opts?: RequestOptions): Promise<ApiResponse<T, Code>>;
  put<T, B = unknown>(url: string, body?: B, opts?: RequestOptions): Promise<ApiResponse<T, Code>>;
  patch<T, B = unknown>(url: string, body?: B, opts?: RequestOptions): Promise<ApiResponse<T, Code>>;
  delete<T, B = unknown>(url: string, body?: B, opts?: RequestOptions): Promise<ApiResponse<T, Code>>;
  /** The underlying axios instance, for layers built on top (e.g. bulk). */
  instance: AxiosInstance;
}

export function createHttp<Code extends string>(host: RequestHost<Code>): Http<Code> {
  const instance = axios.create({ baseURL: host.baseUrl, withCredentials: true });

  instance.interceptors.request.use((config) => {
    const token = host.authToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  function resolve(code: Code): { code: Code; message: string } {
    return { code, message: host.resolveMessage(code) };
  }

  async function request<T>(
    method: HttpMethod,
    url: string,
    body: unknown,
    opts: RequestOptions = {},
  ): Promise<ApiResponse<T, Code>> {
    if (!opts.disableLoading) host.onLoadingStart?.();
    try {
      const res: AxiosResponse<T> = await instance.request<T>({
        method,
        url,
        data: body,
        headers: opts.headers,
        signal: opts.signal,
      });
      return { success: true, data: res.data };
    } catch (error) {
      if (!(error instanceof AxiosError)) {
        return { success: false, errorInfo: resolve('unknown_error' as Code) };
      }

      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED') {
        return { success: false, errorInfo: resolve('internet_down' as Code) };
      }

      const status = error.response?.status;
      if (status === 401) {
        if (!opts.suppressUnauthorized) host.onUnauthorized?.();
      } else if (status === 404 && opts.redirectOnNotFound) {
        host.onNotFound?.();
      }

      const backendCode = (error.response?.data as BackendErrorBody | undefined)?.error;
      const errorInfo = resolve((backendCode ?? 'unknown_error') as Code);
      if (status != null && status >= 500) {
        host.onServerError?.(errorInfo);
      }
      return { success: false, errorInfo };
    } finally {
      if (!opts.disableLoading) host.onLoadingStop?.();
    }
  }

  return {
    get: (url, opts) => request('get', url, undefined, opts),
    post: (url, body, opts) => request('post', url, body, opts),
    put: (url, body, opts) => request('put', url, body, opts),
    patch: (url, body, opts) => request('patch', url, body, opts),
    delete: (url, body, opts) => request('delete', url, body, opts),
    instance,
  };
}
