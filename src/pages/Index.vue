<template>
  <div class="wrapper">
    <d-header></d-header>
    <div class="main"></div>
    <!-- <router-view></router-view> -->
    <d-footer></d-footer>
  </div>
</template>

<script>
import DHeader from '../components/DHeader.vue';
import DFooter from '../components/DFooter.vue';

export default {
  components: {
    DHeader,
    DFooter,
  },
  mounted() {
    // this.$msg('hhh');
  },
};
</script>

<style>
</style>
