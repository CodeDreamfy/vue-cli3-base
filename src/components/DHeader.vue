<template>
  <header>
    <div class="container-left">
      <d-logo></d-logo>
      <div class="project-list">
        <el-dropdown class="d-el-dropdown" :trigger="triggerWay">
          <span class="el-dropdown-link">
            下拉菜单
            <i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown" class="d-dropdown">
            <el-dropdown-item>黄金糕</el-dropdown-item>
            <el-dropdown-item>狮子头</el-dropdown-item>
            <el-dropdown-item>螺蛳粉</el-dropdown-item>
            <el-dropdown-item disabled>双皮奶</el-dropdown-item>
            <el-dropdown-item divided>蚵仔煎</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <div class="operator">
      <a href="javascript:;" class="lock">
        <i class="el-icon-unlock"></i>
        <p>Lock</p>
      </a>
      <a href="javascript:;" class="notification">
        <i class="el-icon-message-solid"></i>
        <p>Notice</p>
      </a>
      <a href="javascript:;" class="user-face"
        @click="childflag = true;">
        <i class="user-face-i">VD</i>
        <p>Vish Desai</p>
        <ul class="child-menu" v-show="childflag" @mouseleave="childflag = false">
          <li>Admin Management</li>
        </ul>
      </a>
      <a href="javascript:;" class="logout">
        <i class="el-icon-switch-button"></i>
        <p>Logout</p>
      </a>
    </div>
  </header>
</template>

<script>
import DLogo from './DLogo.vue';

export default {
  data() {
    return {
      triggerWay: 'click',
      childflag: false,
    };
  },
  components: {
    DLogo,
  },
  mounted() {

  },
};
</script>

<style>
</style>
