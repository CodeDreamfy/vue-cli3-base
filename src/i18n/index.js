import Vue from 'vue';
import VueI18n from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import elmEnLocale from 'element-ui/lib/locale/lang/en';
import elmZhLocale from 'element-ui/lib/locale/lang/zh-CN';
import locale from 'element-ui/lib/locale';
import messages from './lang';

const dateTimeFormats = {
  'en-US': {
    short: {
      year: 'numeric', month: 'short', day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
};
Vue.use(VueI18n);
// 通过选项创建 VueI18n 实例
const defaultLang = localStorage.getItem('currLanguage') || 'zh-CN';
export const i18n = new VueI18n({
  dateTimeFormats,
  // locale: 'en-US', // 设置地区
  locale: defaultLang, // 设置地区
  messages, // 设置地区信息
});
const cookie = {
  get(name) {
    const allCookie = document.cookie;
    if (allCookie.length > 0) {
      const arr = allCookie.split('; ');
      if (Array.isArray(arr)) {
        let result = '';
        arr.find((el) => {
          const [key, value] = el.split('=');
          if (key === name) {
            result = value;
            return true;
          }
          return false;
        });
        return result;
      }
    }
    return '';
  },
  set(key, value) {
    document.cookie = `${key}=${value}`;
  },
};

export default (store) => {
  // element-UI设置语言
  if (defaultLang === 'zh-CN') {
    locale.use(elmZhLocale);
    dayjs.locale('zh-cn');
  } else {
    locale.use(elmEnLocale);
    dayjs.locale('en');
  }
  // cookie.set('lang', defaultLang);
  // store.commit('setLanguage', defaultLang);
  // localStorage.setItem('currLanguage', defaultLang);
  Object.assign(Vue.prototype, {
    // element-ui 语言设置方法的引用
    $elementLocale: locale,
    $dayjs: dayjs,
    /**
     * 语言切换,elementUI  暂只支持了中英文,切换,后期根据需求再添加
     * @param {String} language 传递语言标识: zh-CN / en-US
     * @returns undefined
     */
    $changeLanguage(language = 'zh-CN') {
      const lang = language;
      switch (lang) {
        case 'zh-CN':
          locale.use(elmZhLocale); // element-ui国际化
          dayjs.locale('zh-cn'); // 日期国际化
          i18n.locale = 'zh-CN'; // 语言国际化
          cookie.set('lang', 'zh-CN');
          break;
        case 'en-ja':
        case 'en-de':
        default:
          locale.use(elmEnLocale);
          dayjs.locale('en');
          i18n.locale = lang;
          cookie.set('lang', 'en-US');
          console.log('cookie', document.cookie);
          break;
      }
    },
  });
  return i18n;
};
