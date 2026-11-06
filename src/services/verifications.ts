import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type VerificationType = 'personal' | 'company';
export type ReviewStatus = 0 | 1 | 2;

export type VerificationListItem = {
  id: number;
  user_id: number;
  type: VerificationType;
  phone: string;
  user_type: number;
  display_name: string;
  review_status: ReviewStatus;
  review_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
};

export type VerificationDetail = VerificationListItem & {
  user_status: number;
  personal?: {
    real_name: string;
    id_number_masked?: string;
    store_platform_id?: number;
    store_platform_name?: string;
    store_url?: string;
    id_front_endpoint?: string;
    id_front_bucket?: string;
    id_front_path?: string;
    id_back_endpoint?: string;
    id_back_bucket?: string;
    id_back_path?: string;
    verified_at?: string;
  };
  company?: {
    company_name: string;
    unified_social_credit_code: string;
    business_license_endpoint?: string;
    business_license_bucket?: string;
    business_license_path?: string;
    business_license_url?: string;
    business_license_file_name?: string;
    business_license_file_size?: number;
    business_license_content_type?: string;
    registered_address: string;
    introduction?: string;
    offices: string[];
    factories: string[];
    contacts: Array<{ name: string; position?: string; phone: string }>;
    verified_at?: string;
  };
};

async function ensureSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  if (response.code !== 0) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function listVerifications(params?: {
  type?: VerificationType;
  review_status?: ReviewStatus;
}) {
  const response = await request<ApiEnvelope<{ items: VerificationListItem[] }>>(
    '/api/v1/admin/verifications',
    { method: 'GET', params },
  );
  return ensureSuccess(response, '获取认证审核列表失败');
}

export async function getVerificationDetail(
  type: VerificationType,
  id: number,
) {
  const response = await request<ApiEnvelope<VerificationDetail>>(
    '/api/v1/admin/verifications/detail',
    { method: 'GET', params: { type, id } },
  );
  return ensureSuccess(response, '获取认证详情失败');
}

export async function reviewVerification(data: {
  type: VerificationType;
  id: number;
  action: 'approve' | 'reject';
  reason?: string;
}) {
  const response = await request<ApiEnvelope<VerificationDetail>>(
    '/api/v1/admin/verifications/review',
    { method: 'POST', data },
  );
  return ensureSuccess(response, '提交审核结果失败');
}
