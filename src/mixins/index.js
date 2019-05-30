/**
 * Mixins
 */
export default {
  computed: {
    platform() {
      const u = navigator.userAgent;
      if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
        return 'android';
      }
      if (u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
        return 'ios';
      }
      if (u.match(/iPad/i)) {
        return 'ipad';
      }
      return 'web';
    },
  },
  methods: {

  },
  filters: {

  },
  created() {},
};
