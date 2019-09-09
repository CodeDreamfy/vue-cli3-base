import axios from '@/request/http';
import { BASEURL } from '@/api/base';
/**
 * login模块接口列表
 */

// import base from './base'; // 导入接口域名列表

export default {
  login() {
    return axios.get(BASEURL);
  },
  // 其他接口…………
};
