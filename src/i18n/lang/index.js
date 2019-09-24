import zhcn from './common-zh-CN';
import enus from './common-en-US';
import pages from './pages';
import components from './components';


const lang = {
  'zh-CN': Object.assign(zhcn, pages['zh-CN'], components['zh-CN']),
  'en-US': Object.assign(enus, pages['en-US'], components['en-US']),
};
export default lang;
