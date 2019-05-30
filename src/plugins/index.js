import VueLogger from 'vuejs-logger';
import axios from '@/request/http';
import api from '@/api';
import eventBus from './eventBus';
import logOption from './logger.config';

const myPlugins = {};

myPlugins.install = (Vue) => {
  Vue.use(VueLogger, logOption);
  Object.assign(Vue.prototype, {
    $axios: axios,
    $api: api,
    $bus: eventBus,
  });
};

export default myPlugins;
