import Vue from 'vue';
import Router from 'vue-router';
// import store from '@/stores';
import Login from '../pages/Login.vue';
import Index from '../pages/Index.vue';

import Management from './management';

Vue.use(Router);

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/',
    component: Index,
    // children: [
    //   {

    //   },
    // ],
  },
  ...Management,
  // which is lazy-loaded when the route is visited.
  // component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
];

console.log('process.env.BASE_URL', process.env.BASE_URL);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});
router.beforeRouteEnter = (to, from, next) => {
  next();
};

export default router;
