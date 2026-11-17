import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type RequirementReviewStatus = 0 | 1 | 2;
export type RequirementStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type AdminRequirementAttribute = {
  attribute_id: number;
  attribute_name?: string;
  value: string;
  option_id?: number;
  option_ids?: number[];
};

export type AdminRequirementFile = {
  id: number;
  endpoint: string;
  bucket: string;
  path: string;
  url?: string;
  original_name: string;
  content_type: string;
  size: number;
  sort_order: number;
  created_at: string;
};

export type AdminRequirementResponse = {
  id: number;
  requirement_id: number;
  supplier_user_id: number;
  supplier_company?: string;
  message?: string;
  available_quantity?: number;
  lead_time_days?: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type AdminRequirement = {
  id: number;
  buyer_user_id: number;
  buyer_company?: string;
  category_id: number;
  category_name?: string;
  category_name_snapshot: string;
  name: string;
  quantity: number;
  stock_unit_id: number;
  stock_unit_name?: string;
  stock_unit_name_snapshot: string;
  description?: string;
  delivery_address: string;
  expected_delivery_date?: string;
  contact_name: string;
  contact_phone: string;
  review_status: RequirementReviewStatus;
  review_reason?: string;
  status: RequirementStatus;
  published_at?: string;
  expires_at?: string;
  response_count: number;
  created_at: string;
  updated_at: string;
  attributes?: AdminRequirementAttribute[];
  files?: AdminRequirementFile[];
  responses?: AdminRequirementResponse[];
};

export type AdminRequirementFilters = {
  keyword?: string;
  category_id?: number;
  buyer_user_id?: number;
  review_status?: RequirementReviewStatus;
  status?: RequirementStatus;
  page?: number;
  page_size?: number;
};

export type AdminRequirementListResult = {
  items: AdminRequirement[];
  total: number;
  page: number;
  page_size: number;
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) throw new Error(response.message || fallback);
  return response.data;
}

export async function listAdminProcurementRequirements(params?: AdminRequirementFilters) {
  const response = await request<ApiEnvelope<AdminRequirementListResult>>(
    '/api/v1/admin/procurement/requirements',
    { method: 'GET', params },
  );
  return ensureSuccess(response, '获取需求列表失败');
}

export async function getAdminProcurementRequirementDetail(id: number) {
  const response = await request<ApiEnvelope<AdminRequirement>>(
    '/api/v1/admin/procurement/requirements/detail',
    { method: 'GET', params: { id } },
  );
  return ensureSuccess(response, '获取需求详情失败');
}

export async function reviewAdminProcurementRequirement(params: {
  id: number;
  review_status: 1 | 2;
  reason?: string;
}) {
  const response = await request<ApiEnvelope<AdminRequirement>>(
    '/api/v1/admin/procurement/requirements/review',
    { method: 'POST', data: params },
  );
  return ensureSuccess(response, '提交需求审核结果失败');
}
