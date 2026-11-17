import { request } from '@umijs/max';

import type { ApiEnvelope } from './auth';

export type AnalyticsDailyStat = {
  date: string;
  product_clicks: number;
  requirement_clicks: number;
  total_clicks: number;
};

export type AnalyticsTopContent = {
  id: number;
  name: string;
  clicks: number;
};

export type AnalyticsOverview = {
  days: number;
  start_date: string;
  total_clicks: number;
  product_clicks: number;
  requirement_clicks: number;
  daily: AnalyticsDailyStat[];
  top_products: AnalyticsTopContent[];
  top_requirements: AnalyticsTopContent[];
};

export async function getAnalyticsOverview(days = 30) {
  const response = await request<ApiEnvelope<AnalyticsOverview>>(
    '/api/v1/admin/analytics/overview',
    { method: 'GET', params: { days } },
  );
  if (response.code !== 0) throw new Error(response.message || '获取数据统计失败');
  return response.data;
}
