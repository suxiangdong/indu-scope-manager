import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type CustomerUser = {
  id: number;
  phone: string;
  role: number;
  user_type: number;
  status: number;
  verification_type?: 'personal' | 'company' | string;
  verification_status: 'unsubmitted' | 'pending' | 'rejected' | 'verified' | string;
  wechat_bound: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerUserFilters = {
  phone?: string;
  role?: number;
  user_type?: number;
  status?: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listCustomerUsers(params?: CustomerUserFilters) {
  const response = await request<ApiEnvelope<{ items: CustomerUser[] }>>(
    '/api/v1/admin/customer-users',
    { method: 'GET', params },
  );
  return ensureSuccess(response, '获取用户列表失败');
}

export async function updateCustomerUserStatus(id: number, status: number) {
  const response = await request<ApiEnvelope<CustomerUser>>(
    '/api/v1/admin/customer-users/status',
    { method: 'POST', data: { id, status } },
  );
  return ensureSuccess(response, '修改用户状态失败');
}
