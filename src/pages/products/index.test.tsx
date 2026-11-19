import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function settleRequests(complete: () => void) {
  const environment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await React.act(async () => {
      complete();
    });
  } finally {
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

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

  it('keeps the approved detail when an older pending detail response arrives late', async () => {
    const approval = deferred<void>();
    const oldDetail = deferred<AdminProduct>();
    const pendingSnapshot = { ...product };
    vi.mocked(reviewAdminProduct).mockImplementation(async () => {
      await approval.promise;
      product = { ...product, status: 2 };
      return { ...product };
    });
    vi.mocked(getAdminProductDetail).mockImplementationOnce(
      () => oldDetail.promise,
    );
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await screen.getByRole('button', { name: '审核通过', exact: true }).click();
    await page.getByRole('button', { name: /^确\s*认$/ }).click();
    await vi.waitFor(() => expect(reviewAdminProduct).toHaveBeenCalledWith(12));
    await screen.getByRole('button', { name: '详情', exact: true }).click();
    await vi.waitFor(() =>
      expect(getAdminProductDetail).toHaveBeenCalledWith(12),
    );
    await settleRequests(() => {
      approval.resolve(undefined);
    });
    await expect
      .element(
        screen
          .getByRole('row')
          .filter({ hasText: 'ID: 12' })
          .getByText('已下架', { exact: true }),
      )
      .toBeVisible();
    await settleRequests(() => {
      oldDetail.resolve(pendingSnapshot);
    });
    const drawer = screen.getByRole('dialog');
    await expect
      .element(drawer.getByText('已下架', { exact: true }))
      .toBeVisible();
    await expect
      .element(drawer.getByRole('button', { name: /^上\s*架$/ }))
      .toBeVisible();
    await expect
      .element(drawer.getByText('审核中', { exact: true }))
      .not.toBeInTheDocument();
  });

  it('shows the same offline status in the list and a normally loaded detail', async () => {
    product = { ...product, status: 2 };
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await expect
      .element(screen.getByText('已下架', { exact: true }))
      .toBeVisible();
    await screen.getByRole('button', { name: '详情', exact: true }).click();
    await expect
      .element(screen.getByRole('dialog').getByText('已下架', { exact: true }))
      .toBeVisible();
    expect(getAdminProductDetail).toHaveBeenCalledWith(12);
  });

  it('does not reopen a closed drawer when its pending detail arrives', async () => {
    const oldDetail = deferred<AdminProduct>();
    vi.mocked(getAdminProductDetail).mockImplementationOnce(
      () => oldDetail.promise,
    );
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await screen.getByRole('button', { name: '详情', exact: true }).click();
    await vi.waitFor(() =>
      expect(getAdminProductDetail).toHaveBeenCalledWith(12),
    );
    await screen
      .getByRole('dialog')
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    await settleRequests(() => {
      oldDetail.resolve({ ...product });
    });
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps another product selected when an earlier approval and detail finish late', async () => {
    const approval = deferred<void>();
    const oldDetail = deferred<AdminProduct>();
    const pendingSnapshot = { ...product };
    const otherProduct = {
      ...product,
      id: 13,
      name: '另一台已下架设备',
      status: 2,
    };
    vi.mocked(listAdminProducts).mockImplementation(async () => ({
      items: [{ ...product }, { ...otherProduct }],
      total: 2,
      page: 1,
      page_size: 20,
    }));
    vi.mocked(getAdminProductDetail).mockImplementation(async (id) =>
      id === 12 ? oldDetail.promise : { ...otherProduct },
    );
    vi.mocked(reviewAdminProduct).mockImplementation(async () => {
      await approval.promise;
      product = { ...product, status: 2 };
      return { ...product };
    });
    const screen = await render(
      <App>
        <Products />
      </App>,
    );
    await screen.getByRole('button', { name: '审核通过', exact: true }).click();
    await page.getByRole('button', { name: /^确\s*认$/ }).click();
    await vi.waitFor(() => expect(reviewAdminProduct).toHaveBeenCalledWith(12));
    await screen
      .getByRole('button', { name: '详情', exact: true })
      .nth(0)
      .click();
    await vi.waitFor(() =>
      expect(getAdminProductDetail).toHaveBeenCalledWith(12),
    );
    await screen
      .getByRole('dialog')
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    await screen
      .getByRole('button', { name: '详情', exact: true })
      .nth(1)
      .click();
    const drawer = screen.getByRole('dialog');
    await expect
      .element(drawer.getByText('另一台已下架设备', { exact: true }))
      .toBeVisible();
    await settleRequests(() => {
      approval.resolve(undefined);
      oldDetail.resolve(pendingSnapshot);
    });
    await expect
      .element(drawer.getByText('另一台已下架设备', { exact: true }))
      .toBeVisible();
    await expect
      .element(drawer.getByText('已下架', { exact: true }))
      .toBeVisible();
    await expect
      .element(drawer.getByText('待审核风机', { exact: true }))
      .not.toBeInTheDocument();
  });
});
