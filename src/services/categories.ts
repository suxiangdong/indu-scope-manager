import { request } from '@umijs/max';
import type { ApiEnvelope } from './auth';

export type CategoryListItem = {
  id: number;
  /** 0 means this is a top-level category. */
  parent_id: number;
  name: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type CategoryTreeNode = CategoryListItem & {
  children?: CategoryTreeNode[];
};

export type CategoryFormValues = {
  parent_id?: number;
  name: string;
  sort_order?: number;
  status?: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function listCategories() {
  const response = await request<ApiEnvelope<{ items: CategoryListItem[] }>>(
    '/api/v1/admin/categories',
    { method: 'GET' },
  );
  return ensureSuccess(response, '获取类目列表失败');
}

export async function createCategory(data: Required<CategoryFormValues>) {
  const response = await request<ApiEnvelope<CategoryListItem>>(
    '/api/v1/admin/categories/create',
    {
      method: 'POST',
      data,
    },
  );
  return ensureSuccess(response, '新增类目失败');
}

export async function updateCategory(
  id: number,
  data: CategoryFormValues,
) {
  const response = await request<ApiEnvelope<CategoryListItem>>(
    '/api/v1/admin/categories/update',
    {
      method: 'POST',
      data: { id, ...data },
    },
  );
  return ensureSuccess(response, '修改类目失败');
}

export async function deleteCategory(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/categories/delete',
    {
      method: 'POST',
      data: { id },
    },
  );
  return ensureSuccess(response, '删除类目失败');
}
