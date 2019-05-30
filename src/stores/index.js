/* eslint-disable */
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    componentName: null,
  },
  mutations: {
    setComponentName(state, payload) {
      state.componentName = payload;
    },
  },
  actions: {

  },
});
