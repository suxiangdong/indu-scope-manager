import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type AdminProductImage = {
  id: number;
  url?: string;
  path: string;
  original_name: string;
  content_type: string;
  size: number;
  sort_order: number;
};

export type AdminProductAttribute = {
  attribute_id: number;
  code: string;
  name: string;
  unit?: string;
  value: string;
};

export type AdminProduct = {
  id: number;
  supplier_user_id: number;
  supplier_company?: string;
  category_id: number;
  category_name?: string;
  name: string;
  stock_quantity: number;
  stock_unit_id: number;
  stock_unit_name: string;
  cover_url?: string;
  image_count: number;
  status: number;
  created_at: string;
  updated_at: string;
  images?: AdminProductImage[];
  attributes?: AdminProductAttribute[];
};

export type AdminProductFilters = {
  keyword?: string;
  category_id?: number;
  supplier_user_id?: number;
  status?: number;
  page?: number;
  page_size?: number;
};

export type AdminProductListResult = {
  items: AdminProduct[];
  total: number;
  page: number;
  page_size: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listAdminProducts(params?: AdminProductFilters) {
  const response = await request<ApiEnvelope<AdminProductListResult>>(
    '/api/v1/admin/products',
    { method: 'GET', params },
  );
  return ensureSuccess(response, '获取产品列表失败');
}

export async function getAdminProductDetail(id: number) {
  const response = await request<ApiEnvelope<AdminProduct>>(
    '/api/v1/admin/products/detail',
    { method: 'GET', params: { id } },
  );
  return ensureSuccess(response, '获取产品详情失败');
}

export async function updateAdminProductStatus(id: number, status: number) {
  const response = await request<ApiEnvelope<AdminProduct>>(
    '/api/v1/admin/products/status',
    { method: 'POST', data: { id, status } },
  );
  return ensureSuccess(response, '更新产品状态失败');
}

export async function reviewAdminProduct(id: number) {
  const response = await request<ApiEnvelope<AdminProduct>>(
    '/api/v1/admin/products/review',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '审核产品失败');
}
