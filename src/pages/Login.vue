<template>
  <div :class="['login-wrapper']">
    <div class="logo">
      <d-logo></d-logo>
    </div>
    <div class="login-box">
      <p class="title">Connect to your account</p>
      <div class="form-box">
        <el-input class="d-el-input" v-model="form.username">
          <template slot="prepend">
            <i class="d-el-icon el-icon-s-custom"></i>
          </template>
        </el-input>
        <el-input class="d-el-input" placeholder="请输入密码" v-model="form.password" show-password>
          <template slot="prepend">
            <i class="d-el-icon el-icon-lock"></i>
          </template>
        </el-input>
        <el-button type="primary" class="d-el-button"
          @click="signInHandle"
          @keyup.enter="signInHandle">
          Sign in
        </el-button>
      </div>
      <div class="other-box">
        <a href="javascript:;">Forgot user ID?</a>
        <a href="javascript:;">Forgot password?</a>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import DLogo from '../components/DLogo.vue';

export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: '',
      },
    };
  },
  methods: {
    signInHandle() {
      this.$router.push('/');
    },
  },
  components: {
    DLogo,
  },
  mounted() {
    this.$log.info(this.platform);
    // setTimeout(() => {
    //   this.$log.info('this.$elementLocale', this.$elementLocale);
    //   this.$changeLanguage();
    // }, 5000);
  },
};
</script>
<style scoped lang="scss">
@import "../css/_utils.scss";
@import "../css/login.scss";
</style>
