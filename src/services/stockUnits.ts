import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type StockUnit = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type StockUnitFormValues = {
  code: string;
  name: string;
  sort_order?: number;
  status?: number;
};

export type StockUnitCategory = {
  category_id: number;
  category_name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listStockUnits() {
  const response = await request<ApiEnvelope<{ items: StockUnit[] }>>(
    '/api/v1/admin/stock-units',
    { method: 'GET' },
  );
  return ensureSuccess(response, '获取库存单位失败');
}

export async function createStockUnit(data: Required<StockUnitFormValues>) {
  const response = await request<ApiEnvelope<StockUnit>>(
    '/api/v1/admin/stock-units/create',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '新增库存单位失败');
}

export async function updateStockUnit(id: number, data: StockUnitFormValues) {
  const response = await request<ApiEnvelope<StockUnit>>(
    '/api/v1/admin/stock-units/update',
    { method: 'POST', data: { id, ...data } },
  );
  return ensureSuccess(response, '修改库存单位失败');
}

export async function deleteStockUnit(id: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/stock-units/delete',
    { method: 'POST', data: { id } },
  );
  return ensureSuccess(response, '删除库存单位失败');
}

export async function listStockUnitCategories(stockUnitId: number) {
  const response = await request<ApiEnvelope<{ items: StockUnitCategory[] }>>(
    '/api/v1/admin/stock-units/categories',
    { method: 'GET', params: { stock_unit_id: stockUnitId } },
  );
  return ensureSuccess(response, '获取库存单位类目失败');
}

export async function bindStockUnitCategory(data: {
  stock_unit_id: number;
  category_id: number;
  sort_order?: number;
}) {
  const response = await request<ApiEnvelope<StockUnitCategory>>(
    '/api/v1/admin/stock-units/categories/bind',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '绑定库存单位类目失败');
}

export async function unbindStockUnitCategory(stockUnitId: number, categoryId: number) {
  const response = await request<ApiEnvelope<{ success: boolean }>>(
    '/api/v1/admin/stock-units/categories/unbind',
    {
      method: 'POST',
      data: { stock_unit_id: stockUnitId, category_id: categoryId },
    },
  );
  return ensureSuccess(response, '解除库存单位类目失败');
}
