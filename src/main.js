import Vue from 'vue';
import $ from 'jquery'; // eslint-disable-line
import elementui from '@/plugins/element-ui.config'; // eslint-disable-line
/* element-ui variables */
import './css/element-variables.scss';
import './css/index.scss';
import App from './App.vue';
import router from './routes';
import store from './stores';
import plugin from '@/plugins';
import I18n from '@/i18n';
import mixins from '@/mixins';

Vue.config.productionTip = false;

I18n();
Vue.use(plugin);
Vue.mixin(mixins);

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');
