import request from "@/utils/request";
import axios from "axios";

// 使用与后端匹配的API路径格式，不带前导斜杠
const AUTH_BASE_URL = "api/v1/auth"; 
// 直接API地址
const DIRECT_API_URL = "https://api.youlai.tech";

const AuthAPI = {
  /** 登录接口 */
  login(data: LoginFormData) {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);
    formData.append("captchaKey", data.captchaKey);
    formData.append("captchaCode", data.captchaCode);
    
    console.log("使用request发送登录请求");
    
    // 使用统一的request发送请求
    return request({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /** 刷新 token 接口*/
  refreshToken(refreshToken: string) {
    console.log("使用request刷新token");
    
    return request({
      url: `${AUTH_BASE_URL}/refresh-token`,
      method: "post",
      params: { refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 注销登录接口 */
  logout() {
    console.log("使用request注销登录");
    
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "delete"
    });
  },

  /** 获取验证码接口 - 直接使用axios访问后端API */
  getCaptcha() {
    console.log("直接请求验证码API:", `${DIRECT_API_URL}/${AUTH_BASE_URL}/captcha`);
    
    // 直接使用axios访问完整URL，确保路径正确
    return axios.get(`${DIRECT_API_URL}/api/v1/auth/captcha`)
      .then(response => {
        console.log("验证码API响应:", response);
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
