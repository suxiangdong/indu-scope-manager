import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type HotCategory = {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type HotCategoryFilters = {
  keyword?: string;
  status?: number;
  page?: number;
  page_size?: number;
};

export type HotCategoryListResult = {
  items: HotCategory[];
  total?: number;
  page?: number;
  page_size?: number;
};

export type HotCategoryFormValues = {
  category_id: number;
  sort_order?: number;
  status?: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listHotCategories(params?: HotCategoryFilters) {
  const response = await request<ApiEnvelope<HotCategoryListResult>>(
    '/api/v1/admin/hot-categories',
    { method: 'GET', params },
  );
  return ensureSuccess(response, '获取热门分类失败');
}

export async function createHotCategory(data: Required<HotCategoryFormValues>) {
  const response = await request<ApiEnvelope<HotCategory>>(
    '/api/v1/admin/hot-categories/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增热门分类失败');
}

export async function updateHotCategory(id: number, data: HotCategoryFormValues) {
  const response = await request<ApiEnvelope<HotCategory>>(
    '/api/v1/admin/hot-categories/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改热门分类失败');
}

export async function deleteHotCategory(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/hot-categories/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除热门分类失败');
}

export async function updateHotCategoryStatus(id: number, status: number) {
  const response = await request<ApiEnvelope<HotCategory>>(
    '/api/v1/admin/hot-categories/status',
    { method: 'POST', data: { id, status } },
  );
  return ensureSuccess(response, '更新热门分类状态失败');
}

export async function updateHotCategorySortOrder(items: Array<{ id: number; sort_order: number }>) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/hot-categories/sort',
    { method: 'POST', data: { items } },
  );
  return ensureSuccess(response, '更新热门分类排序失败');
}
