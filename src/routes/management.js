export default [
  {
    path: '/management',
    name: 'management',
    component: () => import(/* webpackChunkName: "management" */ '@/pages/management/Index.vue'),
  },
];
