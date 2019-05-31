import Vue from 'vue';
import store from '@/stores';
import vuexI18n from 'vuex-i18n';
import elmEnLocale from 'element-ui/lib/locale/lang/en';
import elmZhLocale from 'element-ui/lib/locale/lang/zh-CN';
import locale from 'element-ui/lib/locale';
import messages from './lang';

export default () => {
  Vue.use(vuexI18n.plugin, store);

  if (messages) {
    Object.entries(messages).forEach((prop) => {
      Vue.i18n.add(prop[0], prop[1]);
    });
  }
  Vue.i18n.set('en-US');
  // element-UI设置语言
  locale.use(elmEnLocale);
  Object.assign(Vue.prototype, {
    // element-ui 语言设置方法的引用
    $elementLocale: locale,
    /**
     * 语言切换,elementUI  暂只支持了中英文,切换,后期根据需求再添加
     * @param {String} language 传递语言标识: zh-CN / en-US
     * @returns undefined
     */
    $changeLanguage(language) {
      const lang = language || 'en-US';
      switch (lang) {
        case 'zh-CN':
          locale.use(elmZhLocale);
          Vue.i18n.set('zh-CN');
          break;
        case 'en-ja':
        case 'en-de':
        default:
          locale.use(elmEnLocale);
          Vue.i18n.set(lang);
          break;
      }
    },
  });
};
