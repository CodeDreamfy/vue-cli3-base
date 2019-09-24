const importLang = {
  // 引入对应的模块
};
const langs = {
  'zh-CN': {},
  'en-US': {},
};
Object.entries(importLang).forEach(([key, value]) => {
  langs['zh-CN'][key] = value['zh-CN'];
  langs['en-US'][key] = value['en-US'];
});
export default langs;
