import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import qs from "qs";
import { useUserStoreHook } from "@/store/modules/user.store";
import { ResultEnum } from "@/enums/api/result.enum";
import { getAccessToken } from "@/utils/auth";
import router from "@/router";

// 创建 axios 实例
const service = axios.create({
  // 直接使用明确的API地址，避免环境变量问题
  baseURL: "https://api.youlai.tech",
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  paramsSerializer: (params) => qs.stringify(params),
});
// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();
    // 如果 Authorization 设置为 no-auth，则不携带 Token
    if (config.headers.Authorization !== "no-auth" && accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }
    
    // 调试信息：输出当前请求的baseURL和完整URL
    console.log("当前baseURL:", "https://api.youlai.tech");
    console.log("请求URL:", config.url);
    console.log("完整请求路径:", "https://api.youlai.tech" + config.url);
    console.log("请求方法:", config.method);
    console.log("请求头:", JSON.stringify(config.headers));
    
    return config;
  },
  (error) => Promise.reject(error)
);
// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果响应是二进制流，则直接返回，用于下载文件、Excel 导出等
    if (response.config.responseType === "blob") {
      return response;
    }
    const { code, data, msg } = response.data;
    if (code === ResultEnum.SUCCESS) {
      return data;
    }
    ElMessage.error(msg || "系统出错");
    return Promise.reject(new Error(msg || "Error"));
  },
  async (error) => {
    console.error("request error", error); // for debug
    const { config, response } = error;
    if (response) {
      const { code, msg } = response.data;
      if (code === ResultEnum.ACCESS_TOKEN_INVALID) {
        // Token 过期，刷新 Token
        return handleTokenRefresh(config);
      } else if (code === ResultEnum.REFRESH_TOKEN_INVALID) {
        // 刷新 Token 过期，跳转登录页
        await handleSessionExpired();
        return Promise.reject(new Error(msg || "Error"));
      } else {
        ElMessage.error(msg || "系统出错");
      }
    }
    return Promise.reject(error.message);
  }
);
export default service;
// 是否正在刷新标识，避免重复刷新
let isRefreshing = false;
// 因 Token 过期导致的请求等待队列
const waitingQueue: Array<() => void> = [];
// 刷新 Token 处理
async function handleTokenRefresh(config: InternalAxiosRequestConfig) {
  return new Promise((resolve) => {
    // 封装需要重试的请求
    const retryRequest = () => {
      config.headers.Authorization = `Bearer ${getAccessToken()}`;
      resolve(service(config));
    };
    waitingQueue.push(retryRequest);
    if (!isRefreshing) {
      isRefreshing = true;
      useUserStoreHook()
        .refreshToken()
        .then(() => {
          // 依次重试队列中所有请求, 重试后清空队列
          waitingQueue.forEach((callback) => callback());
          waitingQueue.length = 0;
        })
        .catch(async (error) => {
          console.error("handleTokenRefresh error", error);
          // 刷新 Token 失败，跳转登录页
          await handleSessionExpired();
        })
        .finally(() => {
          isRefreshing = false;
        });
    }
  });
}
// 处理会话过期
async function handleSessionExpired() {
  ElNotification({
    title: "提示",
    message: "您的会话已过期，请重新登录",
    type: "info",
  });
  await useUserStoreHook().clearSessionAndCache();
  router.push("/login");
}

console.log("VITE_APP_BASE_API from import.meta.env:", "https://api.youlai.tech");
console.log("All env vars from import.meta.env:", JSON.stringify(import.meta.env)); // 打印所有 Vite 注入的环境变量
