import request from "@/utils/request";
import axios from "axios";

// 使用与后端匹配的API路径格式
const AUTH_BASE_URL = "/api/v1/auth"; 
// 直接访问后端API的基础URL
const DIRECT_API_URL = "https://api.youlai.tech";

const AuthAPI = {
  /** 登录接口 - 直接使用完整URL访问后端API */
  login(data: LoginFormData) {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);
    formData.append("captchaKey", data.captchaKey);
    formData.append("captchaCode", data.captchaCode);
    
    console.log("直接请求登录API");
    
    // 绕过环境变量和项目配置，直接访问后端API
    return axios.post(`${DIRECT_API_URL}/api/v1/auth/login`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(response => {
      console.log("登录API响应:", response.data);
      // 适配API响应结构
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    })
    .catch(error => {
      console.error("登录API请求失败:", error);
      throw error;
    });
  },

  /** 刷新 token 接口*/
  refreshToken(refreshToken: string) {
    console.log("刷新token, 直接请求API");
    
    return axios.post(`${DIRECT_API_URL}/api/v1/auth/refresh-token`, null, {
      params: { refreshToken: refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    })
    .then(response => {
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    })
    .catch(error => {
      console.error("刷新Token失败:", error);
      throw error;
    });
  },

  /** 注销登录接口 */
  logout() {
    console.log("注销登录, 直接请求API");
    
    return axios.delete(`${DIRECT_API_URL}/api/v1/auth/logout`)
    .then(response => {
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    })
    .catch(error => {
      console.error("注销登录失败:", error);
      throw error;
    });
  },

  /** 获取验证码接口 - 直接使用完整URL访问后端API */
  getCaptcha() {
    console.log("直接请求后端验证码API");
    
    // 绕过环境变量和项目配置，直接访问后端API
    return axios.get(`${DIRECT_API_URL}/api/v1/auth/captcha`)
      .then(response => {
        console.log("验证码API响应:", response.data);
        // 适配API响应结构
        if (response.data && response.data.data) {
          return response.data.data;
        }
        return response.data;
      })
      .catch(error => {
        console.error("验证码API请求失败:", error);
        throw error;
      });
  },
};

export default AuthAPI;

/** 登录表单数据 */
export interface LoginFormData {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 验证码缓存key */
  captchaKey: string;
  /** 验证码 */
  captchaCode: string;
  /** 记住我 */
  rememberMe: boolean;
}

/** 登录接口返回结果 */
export interface LoginResult {
  /** 访问token */
  access_token: string;
  /** 刷新token */
  refresh_token: string;
  /** token类型 */
  token_type: string;
  /** 过期时间 (单位: 秒) */
  expires_in: number;
}

/** 验证码信息 */
export interface CaptchaInfo {
  /** 验证码缓存key */
  captchaKey: string;
  /** 验证码图片Base64字符串 */
  captchaBase64: string;
}
