<template>
  <div class="workplan-wrapper">
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTabName: '',
      oldName: '',
      isGantt: false,
      name: 'Workstream',
    };
  },

};
</script>

<style lang=scss>
@import '../../../css/workplan/index.scss';
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
