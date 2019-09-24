# i18n使用说明

## 文件结构
- lang
  - components
    - xxxx
    - xxx
  - pages
    - xxx
  - index.js // 汇集各文件中的语言包，
  - common-zh-CN.js
  - common-en-US.js

## 编写规范
页面的国际化与组件的分别写到对应的文件夹内，然后导入到其文件夹内部的`index.js`中即可，书写规范参考`./lang/pages/login.js`

> 注意: 公共的东西放在common-**.js文件中

```js
export default {
  'zh-CN': {
    loginText: '登录',
    forgotName: '忘记用户名',
    forgotPwd: '忘记密码',
    success: '登录成功',
    error: '登录失败',
  },
  'en-US': {
    loginText: 'Log in',
    forgotName: 'Forgot username',
    forgotPwd: 'Forgot password',
    success: 'Login successfully',
    error: 'Login fail',
  },
};
```

### 使用说明
引入后只需要按照正常的对象引用即可

```js
$t('login.loginText', {type : ''})
```

### API

* 改变语言

```js
  this.setLanguage(language); // language 为字符串，默认为'zh-CN'
```
