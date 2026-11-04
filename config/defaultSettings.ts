import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name 管理后台布局设置
 */
const Settings: ProLayoutProps & {
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#0b7285',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  siderWidth: 240,
  colorWeak: false,
  title: '工业视界管理后台',
  logo: '/logo.svg',
  iconfontUrl: '',
  token: {
    colorTextAppListIcon: '#0b7285',
  },
};

export default Settings;
