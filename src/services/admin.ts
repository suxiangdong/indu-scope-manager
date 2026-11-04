import { request } from '@umijs/max';
import type { ApiEnvelope } from './auth';

export type AdminUserListItem = {
  id: number;
  username: string;
  name: string;
  phone: string;
  status: number;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
};

export type AdminUserListResult = {
  items: AdminUserListItem[];
};

export type AdminUserFormValues = {
  username: string;
  name: string;
  phone: string;
  password?: string;
  status?: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function listAdminUsers() {
  const response = await request<ApiEnvelope<AdminUserListResult>>(
    '/api/v1/admin/users',
    {
      method: 'GET',
    },
  );
  return ensureSuccess(response, '获取管理员列表失败');
}

export async function createAdminUser(data: Required<AdminUserFormValues>) {
  const response = await request<ApiEnvelope<AdminUserListItem>>(
    '/api/v1/admin/users/create',
    {
      method: 'POST',
      data,
    },
  );
  return ensureSuccess(response, '新增管理员失败');
}

export async function updateAdminUser(
  id: number,
  data: AdminUserFormValues,
) {
  const response = await request<ApiEnvelope<AdminUserListItem>>(
    '/api/v1/admin/users/update',
    {
      method: 'POST',
      data: { id, ...data },
    },
  );
  return ensureSuccess(response, '修改管理员失败');
}

export async function deleteAdminUser(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/users/delete',
    {
      method: 'POST',
      data: { id },
    },
  );
  return ensureSuccess(response, '删除管理员失败');
}
