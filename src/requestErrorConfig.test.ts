import { history } from '@umijs/max';
import { message, notification } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, getAccessToken } from '@/services/auth';
import { errorConfig } from './requestErrorConfig';

vi.mock('antd', () => ({
  message: {
    warning: vi.fn(),
    error: vi.fn(),
  },
  notification: {
    open: vi.fn(),
  },
}));

vi.mock('@umijs/max', () => ({
  history: { replace: vi.fn() },
  getIntl: vi.fn(() => ({
    formatMessage: vi.fn(({ defaultMessage }) => defaultMessage),
  })),
}));

vi.mock('@/services/auth', () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

describe('requestErrorConfig', () => {
  // biome-ignore lint/style/noNonNullAssertion: config handlers are always defined
  const errorThrower = errorConfig.errorConfig!.errorThrower!;
  // biome-ignore lint/style/noNonNullAssertion: config handlers are always defined
  const errorHandler = errorConfig.errorConfig!.errorHandler!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('errorThrower', () => {
    it('should throw error when code is nonzero', () => {
      const response = {
        code: 300,
        data: null,
        message: 'Bad Request',
        showType: 2,
      };

      expect(() => {
        errorThrower(response);
      }).toThrow('Bad Request');
    });

    it('should not throw error when code is zero', () => {
      const response = {
        code: 0,
        message: '',
        data: { id: 1 },
      };

      expect(() => {
        errorThrower(response);
      }).not.toThrow();
    });

    it('should throw BizError with correct info', () => {
      const response = {
        code: 300,
        data: { detail: 'more info' },
        message: 'Forbidden',
        showType: 3,
      };

      expect.assertions(5);
      try {
        errorThrower(response);
      } catch (error: any) {
        expect(error.name).toBe('BizError');
        expect(error.info.errorCode).toBe(300);
        expect(error.info.errorMessage).toBe('Forbidden');
        expect(error.info.showType).toBe(3);
        expect(error.info.data).toEqual({ detail: 'more info' });
      }
    });
  });

  describe('errorHandler', () => {
    it('should rethrow error when skipErrorHandler is true', () => {
      const error = new Error('Test error');
      const opts = { skipErrorHandler: true };

      expect(() => {
        errorHandler(error, opts);
      }).toThrow('Test error');
    });

    it('should handle SILENT showType', () => {
      const error: any = new Error('Silent error');
      error.name = 'BizError';
      error.info = {
        errorCode: 1001,
        errorMessage: 'Silent error',
        showType: 0,
      };

      errorHandler(error, {});

      expect(message.warning).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
      expect(notification.open).not.toHaveBeenCalled();
    });

    it('should handle WARN_MESSAGE showType', () => {
      const error: any = new Error('Warning');
      error.name = 'BizError';
      error.info = {
        errorCode: 1002,
        errorMessage: 'This is a warning',
        showType: 1,
      };

      errorHandler(error, {});

      expect(message.warning).toHaveBeenCalledWith('This is a warning');
    });

    it('should handle ERROR_MESSAGE showType', () => {
      const error: any = new Error('Error message');
      error.name = 'BizError';
      error.info = {
        errorCode: 1003,
        errorMessage: 'This is an error',
        showType: 2,
      };

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith('This is an error');
    });

    it('should handle NOTIFICATION showType', () => {
      const error: any = new Error('Notification');
      error.name = 'BizError';
      error.info = {
        errorCode: 1004,
        errorMessage: 'This is a notification',
        showType: 3,
      };

      errorHandler(error, {});

      expect(notification.open).toHaveBeenCalledWith({
        message: '1004',
        description: 'This is a notification',
      });
    });

    it('should handle REDIRECT showType', () => {
      const error: any = new Error('Redirect');
      error.name = 'BizError';
      error.info = {
        errorCode: 401,
        errorMessage: 'Unauthorized',
        showType: 9,
      };

      errorHandler(error, {});
      // cancel the real navigation triggered by REDIRECT before it tears down the test page
      window.stop();

      // REDIRECT 分支不应触发任何消息/通知提示
      expect(message.warning).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
      expect(notification.open).not.toHaveBeenCalled();
    });

    it('should handle default case for unknown showType', () => {
      const error: any = new Error('Unknown type');
      error.name = 'BizError';
      error.info = {
        errorCode: 1005,
        errorMessage: 'Unknown error type',
        showType: 99,
      };

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith('Unknown error type');
    });

    it('should handle axios response error', () => {
      const error: any = new Error('Axios error');
      error.response = {
        status: 500,
        data: {},
      };

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith('请求失败（500）');
    });

    it('clears an expired session on HTTP 401', () => {
      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      errorHandler(error, {});

      expect(clearAccessToken).toHaveBeenCalled();
      expect(history.replace).toHaveBeenCalledWith('/user/login');
    });

    it('preserves the session when an administrator lacks permission', () => {
      const error: any = new Error('Forbidden');
      error.response = { status: 403 };
      errorHandler(error, {});

      expect(clearAccessToken).not.toHaveBeenCalled();
      expect(history.replace).not.toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledWith('请求失败（403）');
    });

    it('should handle offline error', () => {
      const error: any = new Error('Network error');
      error.request = {};

      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      try {
        errorHandler(error, {});

        expect(message.error).toHaveBeenCalledWith(
          'Network unavailable. Please check your connection and try again.',
        );
      } finally {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: originalOnLine,
        });
      }
    });

    it('should handle request error with no response', () => {
      const error: any = new Error('Request error');
      error.request = {};

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith(
        'None response! Please retry.',
      );
    });

    it('should handle generic error', () => {
      const error: any = new Error('Generic error');

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith(
        'Request error, please retry.',
      );
    });
  });

  describe('requestInterceptors', () => {
    // The interceptor is registered as a plain function (not a tuple),
    // so narrow the union type to a callable for the test.
    const interceptor = errorConfig.requestInterceptors?.[0] as (config: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    }) => { url?: string; headers?: Record<string, string> };

    beforeEach(() => {
      vi.mocked(getAccessToken).mockReturnValue(undefined);
    });

    it('should pass through config without modification', () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'GET',
      };

      const result = interceptor(config);

      expect(result.url).toBe('https://api.example.com/users');
    });

    it('should handle URL without config', () => {
      const config = {};

      const result = interceptor(config);

      expect(result.url).toBeUndefined();
    });

    it('adds the stored bearer token to authenticated requests', () => {
      vi.mocked(getAccessToken).mockReturnValue('test-token');

      expect(interceptor({ url: '/api/v1/admin/me' }).headers).toEqual({
        Authorization: 'Bearer test-token',
      });
    });

    it('does not attach a previous token to login requests', () => {
      vi.mocked(getAccessToken).mockReturnValue('test-token');

      expect(
        interceptor({ url: '/api/v1/admin/auth/login' }).headers,
      ).toBeUndefined();
    });
  });
});
