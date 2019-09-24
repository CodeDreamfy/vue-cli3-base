import Vue from 'vue';
import Router from 'vue-router';
// import store from '@/stores';
import Index from '../pages/Index.vue';


Vue.use(Router);

const routes = [

  {
    path: '/',
    component: Index,
    // children: [
    //   {

    //   },
    // ],
  },
  // which is lazy-loaded when the route is visited.
  // component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
];


const router = new Router({
  mode: 'history',
  // base: process.env.BASE_URL,
  routes,
});
router.beforeRouteEnter = (to, from, next) => {
  next();
};

export default router;
