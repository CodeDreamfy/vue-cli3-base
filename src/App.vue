<template>
  <div id="app">
    <router-view/>
    <div :is="ComponentName"></div>
  </div>
</template>
<script>
export default {
  computed: {
    ComponentName() {
      return this.$store.state.componentName;
    },
  },
  mounted() {
    console.log(this.$t('login.success'));
    // this.$api.login.login()
  },
};
</script>
