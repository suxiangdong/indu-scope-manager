import {
  CheckCircleFilled,
  LockOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, useModel } from '@umijs/max';
import { Alert, App, Card, Space, Spin, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { startTransition, useEffect, useState } from 'react';

import {
  clearAccessToken,
  getAccessToken,
  login,
  currentUser as queryCurrentUser,
} from '@/services/auth';
import Settings from '../../../../config/defaultSettings';
import './index.less';

const getSafeRedirectUrl = (redirect: string | null) => {
  if (!redirect?.startsWith('/') || redirect.startsWith('//')) return '/';
  try {
    const parsed = new URL(redirect, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
};

const useStyles = createStyles(({ token }) => ({
  page: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    padding: 32,
    background: '#eef3f8',
  },
  glow: {
    position: 'absolute',
    width: 520,
    height: 520,
    right: -180,
    top: -180,
    borderRadius: '50%',
    background: 'rgba(39, 163, 181, 0.12)',
    filter: 'blur(4px)',
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 460px',
    width: 'min(1160px, 100%)',
    minHeight: 680,
    margin: '0 auto',
    overflow: 'hidden',
    borderRadius: 28,
    background: token.colorBgContainer,
    boxShadow: '0 28px 80px rgba(25, 55, 79, 0.16)',
  },
  brandPanel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '64px 68px',
    overflow: 'hidden',
    color: '#fff',
    background:
      'radial-gradient(circle at 84% 14%, rgba(87, 215, 218, 0.34), transparent 30%), linear-gradient(145deg, #082d48 0%, #0a5167 54%, #0d7881 100%)',
  },
  brandGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.18,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)',
    backgroundSize: '42px 42px',
    maskImage: 'linear-gradient(to bottom right, black, transparent 72%)',
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  brandMark: {
    display: 'grid',
    width: 48,
    height: 48,
    placeItems: 'center',
    border: '1px solid rgba(255,255,255,.35)',
    borderRadius: 14,
    background: 'rgba(255,255,255,.12)',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
  },
  brandName: {
    margin: 0,
    color: '#fff',
    fontSize: 20,
    fontWeight: 650,
    letterSpacing: 1,
  },
  brandEn: {
    margin: '2px 0 0',
    color: 'rgba(255,255,255,.62)',
    fontSize: 11,
    letterSpacing: 2.4,
  },
  brandCopy: {
    maxWidth: 560,
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: '68px 0 56px',
  },
  eyebrow: {
    marginBottom: 18,
    color: '#75e1dd',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
  },
  brandTitle: {
    margin: 0,
    color: '#fff',
    fontSize: 'clamp(34px, 4vw, 52px)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -1,
  },
  brandTitleAccent: {
    color: '#83e3dc',
  },
  brandDescription: {
    maxWidth: 460,
    margin: '24px 0 0',
    color: 'rgba(255,255,255,.72)',
    fontSize: 15,
    lineHeight: 1.9,
  },
  featureList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 30,
  },
  feature: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 13px',
    border: '1px solid rgba(255,255,255,.18)',
    borderRadius: 999,
    background: 'rgba(255,255,255,.08)',
    color: 'rgba(255,255,255,.86)',
    fontSize: 13,
  },
  brandFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'rgba(255,255,255,.42)',
    fontSize: 11,
    letterSpacing: 2,
  },
  formPanel: {
    display: 'flex',
    alignItems: 'center',
    padding: '56px 58px',
    background: '#fff',
  },
  formCard: {
    width: '100%',
    border: 0,
    boxShadow: 'none',
  },
  mobileBrand: {
    display: 'none',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  mobileMark: {
    display: 'grid',
    width: 38,
    height: 38,
    placeItems: 'center',
    borderRadius: 11,
    background: token.colorPrimary,
    color: '#fff',
    fontWeight: 700,
  },
  formEyebrow: {
    marginBottom: 10,
    color: token.colorPrimary,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
  },
  formTitle: {
    margin: 0,
    color: token.colorTextHeading,
    fontSize: 30,
    lineHeight: 1.3,
  },
  formDescription: {
    display: 'block',
    marginTop: 12,
    color: token.colorTextSecondary,
    lineHeight: 1.7,
  },
  securityHint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    margin: '18px 0 24px',
    padding: '11px 13px',
    borderRadius: 10,
    background: '#f4f8fb',
    color: token.colorTextSecondary,
    fontSize: 12,
    lineHeight: 1.6,
  },
  form: {
    marginTop: 24,
  },
  footer: {
    position: 'absolute',
    right: 32,
    bottom: 18,
    left: 32,
    zIndex: 1,
    color: token.colorTextQuaternary,
    fontSize: 12,
    textAlign: 'center',
  },
}));

const Login: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [checkingSession, setCheckingSession] = useState(() =>
    Boolean(getAccessToken()),
  );

  useEffect(() => {
    if (!getAccessToken()) {
      setCheckingSession(false);
      return;
    }

    let active = true;
    queryCurrentUser({ skipErrorHandler: true })
      .then((currentUser) => {
        if (!active) return;
        startTransition(() => {
          setInitialState((state) => ({ ...state, currentUser }));
        });
        history.replace('/dashboard');
      })
      .catch(() => {
        clearAccessToken();
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [setInitialState]);

  const handleSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setErrorMessage(undefined);
    try {
      await login(values);
      const currentUser = await initialState?.fetchUserInfo?.();
      if (currentUser) {
        startTransition(() => {
          setInitialState((state) => ({ ...state, currentUser }));
        });
      }
      message.success('登录成功');
      const redirect = new URL(window.location.href).searchParams.get(
        'redirect',
      );
      history.replace(getSafeRedirectUrl(redirect));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '登录失败，请重试',
      );
    }
  };

  if (checkingSession) {
    return (
      <div className={`${styles.page} login-page`}>
        <Spin size="large" tip="正在检查登录状态..." />
      </div>
    );
  }

  return (
    <div className={`${styles.page} login-page`}>
      <Helmet>
        <title>{Settings.title} - 登录</title>
      </Helmet>
      <div className={styles.glow} />
      <main className={`${styles.shell} login-shell`}>
        <section
          className={`${styles.brandPanel} login-brand-panel`}
          aria-label="工业视界介绍"
        >
          <div className={styles.brandGrid} />
          <div className={styles.brandContent}>
            <div className={styles.brandHeader}>
              <div className={styles.brandMark}>工</div>
              <div>
                <p className={styles.brandName}>工业视界</p>
                <p className={styles.brandEn}>INDU SCOPE</p>
              </div>
            </div>
            <div className={`${styles.brandCopy} login-brand-copy`}>
              <div className={styles.eyebrow}>INDUSTRIAL DIGITAL PLATFORM</div>
              <h1 className={`${styles.brandTitle} login-brand-title`}>
                让工业供需
                <br />
                <span className={styles.brandTitleAccent}>连接得更高效</span>
              </h1>
              <p
                className={`${styles.brandDescription} login-brand-description`}
              >
                统一管理用户认证、供货资源与采购信息，帮助团队更清晰地掌握业务状态。
              </p>
              <div className={styles.featureList}>
                <span className={styles.feature}>
                  <CheckCircleFilled /> 用户认证管理
                </span>
                <span className={styles.feature}>
                  <CheckCircleFilled /> 供需信息管理
                </span>
                <span className={styles.feature}>
                  <CheckCircleFilled /> 安全权限控制
                </span>
              </div>
            </div>
            <div className={styles.brandFooter}>
              <span>INDU SCOPE</span>
              <span>管理后台</span>
            </div>
          </div>
        </section>

        <section
          className={`${styles.formPanel} login-form-panel`}
          aria-label="管理员登录"
        >
          <Card className={styles.formCard} variant="borderless">
            <div className={`${styles.mobileBrand} login-mobile-brand`}>
              <div className={styles.mobileMark}>工</div>
              <Typography.Text strong>工业视界管理后台</Typography.Text>
            </div>
            <div className={styles.formEyebrow}>ADMIN CONSOLE</div>
            <Typography.Title level={2} className={styles.formTitle}>
              欢迎回来
            </Typography.Title>
            <Typography.Text className={styles.formDescription}>
              登录管理后台，开始处理平台事务
            </Typography.Text>
            <div className={styles.securityHint}>
              <SafetyCertificateOutlined
                style={{ color: '#0c7881', marginTop: 2 }}
              />
              <span>
                请使用管理员账号登录，系统会保护你的操作权限与业务数据。
              </span>
            </div>

            <LoginForm
              className={styles.form}
              contentStyle={{ minWidth: 0, maxWidth: '100%', padding: 0 }}
              containerStyle={{ width: '100%', padding: 0 }}
              logo={false}
              title={false}
              subTitle={false}
              message={false}
              submitter={{
                searchConfig: { submitText: '登录管理后台' },
              }}
              initialValues={{
                username:
                  process.env.NODE_ENV === 'development'
                    ? 'cffyadmin'
                    : undefined,
              }}
              onFinish={async (values) => {
                await handleSubmit(
                  values as { username: string; password: string },
                );
              }}
            >
              {errorMessage && (
                <Alert
                  title={errorMessage}
                  type="error"
                  showIcon
                  style={{ marginBottom: 20 }}
                />
              )}
              <ProFormText
                name="username"
                label="管理员账号"
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined />,
                  autoComplete: 'username',
                }}
                placeholder="请输入管理员账号或手机号"
                rules={[
                  { required: true, message: '请输入管理员账号或手机号' },
                ]}
              />
              <ProFormText.Password
                name="password"
                label="登录密码"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                  autoComplete: 'current-password',
                }}
                placeholder="请输入登录密码"
                rules={[{ required: true, message: '请输入登录密码' }]}
              />
            </LoginForm>

            <Space size={8} style={{ marginTop: 22 }}>
              <Tag color="blue">安全登录</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                工业视界管理后台
              </Typography.Text>
            </Space>
          </Card>
        </section>
      </main>
      <div className={`${styles.footer} login-footer`}>
        © {new Date().getFullYear()} 工业视界 · 管理后台
      </div>
    </div>
  );
};

export default Login;
