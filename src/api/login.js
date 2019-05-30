import axios from '@/request/http';
/**
 * login模块接口列表
 */

// import base from './base'; // 导入接口域名列表

export default {
  login() {
    return axios.get('http://baidu.com');
  },
  // 其他接口…………
};
