export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: '登录',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/dashboard',
    name: '工作台',
    icon: 'dashboard',
    component: './dashboard',
  },
  {
    path: '/operations',
    name: '业务运营',
    icon: 'audit',
    routes: [
      {
        path: '/operations/users',
        name: '用户管理',
        icon: 'user',
        component: './coming-soon',
      },
      {
        path: '/operations/verifications',
        name: '认证审核',
        icon: 'safety',
        component: './coming-soon',
      },
      {
        path: '/operations/channels',
        name: '销售渠道审核',
        icon: 'shop',
        component: './coming-soon',
      },
    ],
  },
  {
    path: '/catalog',
    name: '商品中心',
    icon: 'appstore',
    routes: [
      {
        path: '/catalog/categories',
        name: '类目管理',
        icon: 'folder',
        component: './categories',
      },
      {
        path: '/catalog/attributes',
        name: '属性管理',
        icon: 'tags',
        component: './attributes',
      },
      {
        path: '/catalog/attribute-groups',
        name: '属性分组',
        icon: 'cluster',
        component: './attribute-groups',
      },
      {
        path: '/catalog/products',
        name: '产品管理',
        icon: 'database',
        component: './coming-soon',
      },
    ],
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'setting',
    routes: [
      {
        path: '/system/admins',
        name: '管理员账号',
        icon: 'team',
        component: './users',
      },
    ],
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];
