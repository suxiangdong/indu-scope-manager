import { request } from '@umijs/max';

export const ACCESS_TOKEN_KEY = 'indu_scope_manager_access_token';

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  request_id?: string;
};

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  phone?: string;
  status: number;
  role_codes?: string[];
};

export type AuthData = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AdminUser;
};

export type AdminLoginParams = {
  username: string;
  password: string;
};

export function getAccessToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

export function clearAccessToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export async function logout() {
  clearAccessToken();
}

export async function login(params: AdminLoginParams) {
  const response = await request<ApiEnvelope<AuthData>>(
    '/api/v1/admin/auth/login',
    {
      method: 'POST',
      data: params,
    },
  );
  if (response.code !== 0 || !response.data?.access_token) {
    throw new Error(response.message || '登录失败');
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
  return response.data;
}

export async function currentUser(options?: { [key: string]: unknown }) {
  const response = await request<ApiEnvelope<AdminUser>>('/api/v1/admin/me', {
    method: 'GET',
    ...(options || {}),
  });
  if (response.code !== 0) {
    throw new Error(response.message || '获取管理员信息失败');
  }
  return response.data;
}
