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
    path: '/analytics',
    name: '数据统计',
    icon: 'barChart',
    component: './analytics',
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
        component: './customer-users',
      },
      {
        path: '/operations/verifications',
        name: '认证审核',
        icon: 'safety',
        component: './verifications',
      },
      {
        path: '/operations/requirements',
        name: '需求审核',
        icon: 'file-search',
        component: './requirements',
      },
      {
        path: '/operations/vip-orders',
        name: '会员订单',
        icon: 'account-book',
        component: './vip-orders',
        access: 'canAdmin',
      },
      {
        path: '/operations/vip-refunds',
        name: '退款管理',
        icon: 'rollback',
        component: './vip-refunds',
        access: 'canAdmin',
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
        path: '/catalog/hot-categories',
        name: '热门分类',
        icon: 'star',
        component: './hot-categories',
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
        name: '产品审核',
        icon: 'database',
        component: './products',
      },
      {
        path: '/catalog/stock-units',
        name: '库存单位',
        icon: 'number',
        component: './stock-units',
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
        access: 'canSuperAdmin',
      },
      {
        path: '/system/store-platforms',
        name: '店铺平台',
        icon: 'shop',
        component: './store-platforms',
      },
      {
        path: '/system/app-pages',
        name: '小程序页面',
        icon: 'file-text',
        component: './app-pages',
      },
      {
        path: '/system/vip-plans',
        name: '会员套餐',
        icon: 'crown',
        component: './vip-plans',
      },
      {
        path: '/system/vip-agreements',
        name: '协议管理',
        icon: 'file-protect',
        component: './vip-agreements',
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
