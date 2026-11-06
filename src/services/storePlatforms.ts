import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type StorePlatform = {
  id: number;
  name: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type StorePlatformFormValues = {
  name: string;
  sort_order?: number;
  status?: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listStorePlatforms() {
  const response = await request<ApiEnvelope<{ items: StorePlatform[] }>>(
    '/api/v1/admin/store-platforms',
    { method: 'GET' },
  );
  return ensureSuccess(response, '获取店铺平台失败');
}

export async function createStorePlatform(data: Required<StorePlatformFormValues>) {
  const response = await request<ApiEnvelope<StorePlatform>>(
    '/api/v1/admin/store-platforms/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增店铺平台失败');
}

export async function updateStorePlatform(id: number, data: StorePlatformFormValues) {
  const response = await request<ApiEnvelope<StorePlatform>>(
    '/api/v1/admin/store-platforms/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改店铺平台失败');
}

export async function deleteStorePlatform(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/store-platforms/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除店铺平台失败');
}
