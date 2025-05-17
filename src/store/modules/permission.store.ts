import type { RouteRecordRaw } from "vue-router";
import { constantRoutes } from "@/router";
import { store } from "@/store";
import router from "@/router";

import MenuAPI, { type RouteVO } from "@/api/system/menu.api";
const modules = import.meta.glob("../../views/**/**.vue");
const Layout = () => import("@/layout/index.vue");

// 中文标题到国际化标识的映射表
const titleToI18nMap: Record<string, string> = {
  "首页": "dashboard",
  "系统管理": "system",
  "用户管理": "user",
  "角色管理": "role",
  "菜单管理": "menu",
  "部门管理": "dept",
  "字典管理": "dict",
  "配置管理": "config",
  "通知公告": "notice",
  "代码生成": "generator",
  "接口文档": "swagger",
  "Swagger文档": "swagger-ui",
  "Knife4j文档": "knife4j-ui",
  "平台文档": "platform",
  "表单设计": "formGen",
  "组件封装": "component",
  "剪切板": "clipboard",
  "水印": "watermark",
  "引导页": "guide",
  "WebSocket示例": "websocket",
  "电子签名": "signature",
  "多级菜单": "nested",
  "菜单1": "menu1",
  "菜单1-1": "menu1-1",
  "菜单1-2": "menu1-2",
  "菜单1-2-1": "menu1-2-1",
  "菜单1-2-2": "menu1-2-2",
  "菜单1-3": "menu1-3",
  "菜单2": "menu2",
  "个人中心": "profile",
  "我的通知": "my-notice",
  "项目文档": "document",

  "路由参数": "route-params",
  "功能演示": "feature-demo",
  "项目文档(外链)": "external-document",
  "后端文档": "backend-document",
  "移动端文档": "mobile-document",
  "菜单一级": "menu-level-1",
  "增删改查": "crud",
  "列表选择器": "list-selector",
  "富文本编辑器": "rich-text-editor",
  "图片上传": "image-upload",
  "字典组件": "dict-component",
  "图标选择器": "icon-selector",
  "拖拽组件": "drag-component",
  "滚动文本": "scrolling-text"
};

export const usePermissionStore = defineStore("permission", () => {
  // 储所有路由，包括静态路由和动态路由
  const routes = ref<RouteRecordRaw[]>([]);
  // 混合模式左侧菜单路由
  const mixedLayoutLeftRoutes = ref<RouteRecordRaw[]>([]);
  // 路由是否加载完成
  const isRoutesLoaded = ref(false);

  /**
   * 获取后台动态路由数据，解析并注册到全局路由
   *
   * @returns Promise<RouteRecordRaw[]> 解析后的动态路由列表
   */
  function generateRoutes() {
    return new Promise<RouteRecordRaw[]>((resolve, reject) => {
      MenuAPI.getRoutes()
        .then((data) => {
          const dynamicRoutes = parseDynamicRoutes(data);
          routes.value = [...constantRoutes, ...dynamicRoutes];
          isRoutesLoaded.value = true;
          resolve(dynamicRoutes);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 根据父菜单路径设置混合模式左侧菜单
   *
   * @param parentPath 父菜单的路径，用于查找对应的菜单项
   */
  const setMixedLayoutLeftRoutes = (parentPath: string) => {
    const matchedItem = routes.value.find((item) => item.path === parentPath);
    if (matchedItem && matchedItem.children) {
      mixedLayoutLeftRoutes.value = matchedItem.children;
    }
  };

  /**
   * 重置路由
   */
  const resetRouter = () => {
    //  从 router 实例中移除动态路由
    routes.value.forEach((route) => {
      if (route.name && !constantRoutes.find((r) => r.name === route.name)) {
        router.removeRoute(route.name);
      }
    });

    // 清空本地存储的路由和菜单数据
    routes.value = [];
    mixedLayoutLeftRoutes.value = [];
    isRoutesLoaded.value = false;
  };

  return {
    routes,
    mixedLayoutLeftRoutes,
    isRoutesLoaded,
    generateRoutes,
    setMixedLayoutLeftRoutes,
    resetRouter,
  };
});

/**
 * 将中文标题转换为对应的国际化标识
 * 
 * @param title 中文标题
 * @returns 国际化标识
 */
function mapTitleToI18n(title: string): string {
  return titleToI18nMap[title] || title;
}

/**
 * 解析后端返回的路由数据并转换为 Vue Router 兼容的路由配置
 *
 * @param rawRoutes 后端返回的原始路由数据
 * @returns 解析后的路由配置数组
 */
const parseDynamicRoutes = (rawRoutes: RouteVO[]): RouteRecordRaw[] => {
  const parsedRoutes: RouteRecordRaw[] = [];

  rawRoutes.forEach((route) => {
    const normalizedRoute = { ...route } as RouteRecordRaw;

    // 处理组件路径
    normalizedRoute.component =
      normalizedRoute.component?.toString() === "Layout"
        ? Layout
        : modules[`../../views/${normalizedRoute.component}.vue`] ||
          modules["../../views/error-page/404.vue"];
    
    // 处理标题国际化
    if (normalizedRoute.meta?.title) {
      normalizedRoute.meta.title = mapTitleToI18n(normalizedRoute.meta.title);
    }

    // 递归解析子路由
    if (normalizedRoute.children) {
      normalizedRoute.children = parseDynamicRoutes(route.children);
    }

    parsedRoutes.push(normalizedRoute);
  });

  return parsedRoutes;
};

/**
 * 在组件外使用 Pinia store 实例 @see https://pinia.vuejs.org/core-concepts/outside-component-usage.html
 */
export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
