/**
 * 接口域名的管理
 */
let baseUrl;
if (process.env.NODE_ENV === 'production') {
  if (process.env.VUE_APP_condition === 'alpha') {
    baseUrl = '/demo/dealbook/server';
  } else {
    baseUrl = '/dealbook/server';
  }
} else {
  baseUrl = '/dev/server';
}

console.log('BASEURL', process.env.NODE_ENV, process.env.VUE_APP_condition);

export const BASEURL = baseUrl;

export default {
  BASEURL,
};
