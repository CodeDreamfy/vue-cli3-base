/* eslint-disable */
export default {
  inserted(el, binding) {

  },
  bind(el, binding, vnode) {
    function documentHandler(e) {
      console.log('documentHandler', el.contains(e.target));
      if (el.contains(e.target)) {
        return false;
      }
      binding.value(e);
    }
    el.__vueClickOutside__ = documentHandler;
    document.addEventListener('click', documentHandler, false);
  },
  update() {

  },
  unbind(el, binding) {
    if (el.__vueClickOutside__) {
      document.removeEventListener('click', el.__vueClickOutside__, false);
    }
    delete el.__vueClickOutside__;
  },
};
