import { App } from 'antd';
import { page } from 'vitest/browser';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
  type AdminProduct,
  getAdminProductDetail,
  listAdminProducts,
  reviewAdminProduct,
  updateAdminProductStatus,
} from '@/services/adminProducts';
import { listCategories } from '@/services/categories';

vi.mock('@ant-design/pro-components', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ant-design/pro-components')>();
  return {
    ...actual,
    PageContainer: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});
vi.mock('@/services/adminProducts', () => ({
  getAdminProductDetail: vi.fn(),
  listAdminProducts: vi.fn(),
  reviewAdminProduct: vi.fn(),
  updateAdminProductStatus: vi.fn(),
}));
vi.mock('@/services/categories', () => ({ listCategories: vi.fn() }));

import Products from './index';

let product: AdminProduct;

beforeEach(() => {
  vi.clearAllMocks();
  product = {
    id: 12,
    supplier_user_id: 2,
    category_id: 1,
    name: '待审核风机',
    stock_quantity: 10,
    stock_unit_id: 1,
    stock_unit_name: '台',
    image_count: 0,
    status: 0,
    created_at: '',
    updated_at: '',
  };
  vi.mocked(listCategories).mockResolvedValue({ items: [] });
  vi.mocked(listAdminProducts).mockImplementation(async () => ({
    items: [{ ...product }],
    total: 1,
    page: 1,
    page_size: 20,
  }));
  vi.mocked(getAdminProductDetail).mockImplementation(async () => ({
    ...product,
  }));
  vi.mocked(reviewAdminProduct).mockImplementation(async () => {
    product = { ...product, status: 2 };
    return { ...product };
  });
  vi.mocked(updateAdminProductStatus).mockImplementation(
    async (_id, status) => {
      product = { ...product, status };
      return { ...product };
    },
  );
});

describe('product approval and shelf actions', () => {
  it('requires approval before a separate listing action in the product table', async () => {
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await expect
      .element(screen.getByRole('button', { name: '审核通过', exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: '上架', exact: true }))
      .not.toBeInTheDocument();
    await screen.getByRole('button', { name: '审核通过', exact: true }).click();
    await page.getByRole('button', { name: /^确\s*认$/ }).click();
    await vi.waitFor(() => expect(reviewAdminProduct).toHaveBeenCalledWith(12));
    expect(updateAdminProductStatus).not.toHaveBeenCalled();
    await expect
      .element(screen.getByRole('button', { name: '上架', exact: true }))
      .toBeVisible();
    await screen.getByRole('button', { name: '上架', exact: true }).click();
    await page.getByRole('button', { name: /^确\s*认$/ }).click();
    await vi.waitFor(() =>
      expect(updateAdminProductStatus).toHaveBeenCalledWith(12, 1),
    );
    await expect
      .element(screen.getByRole('button', { name: '下架', exact: true }))
      .toBeVisible();
  });

  it('uses approval in the drawer and updates it to listing only after approval succeeds', async () => {
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await screen.getByRole('button', { name: '详情', exact: true }).click();
    const drawer = screen.getByRole('dialog');
    await expect
      .element(drawer.getByRole('button', { name: '审核通过', exact: true }))
      .toBeVisible();
    await expect
      .element(drawer.getByRole('button', { name: '上架', exact: true }))
      .not.toBeInTheDocument();
    await drawer.getByRole('button', { name: '审核通过', exact: true }).click();
    await page.getByRole('button', { name: /^确\s*认$/ }).click();
    await expect
      .element(drawer.getByRole('button', { name: /^上\s*架$/ }))
      .toBeVisible();
    expect(reviewAdminProduct).toHaveBeenCalledTimes(1);
    expect(updateAdminProductStatus).not.toHaveBeenCalled();
  });
});
