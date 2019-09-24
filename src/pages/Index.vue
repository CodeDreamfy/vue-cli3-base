<template>
  <div class="wrapper">
    <header>Gantt</header>
    <div class="main">
      <div class="left-box">
        <work-item-wrap></work-item-wrap>
      </div>
      <div class="gantt-box"></div>
    </div>
    <footer></footer>
    <!-- <router-view></router-view> -->
  </div>
</template>

<script>
import WorkItemWrap from '@/components/WorkItemWrap.vue';

export default {
  components: {
    WorkItemWrap,
  },
};
</script>

<style lang=scss >
</style>
