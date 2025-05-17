<template>
  <div :class="['navbar__right', navbarRightClass]">
    <!-- 桌面端显示 -->
    <template v-if="isDesktop">
      <!-- 搜索 -->
      <MenuSearch />

      <!-- 全屏 -->
      <Fullscreen />

      <!-- 布局大小 -->
      <SizeSelect />

      <!-- 语言选择 -->
      <LangSelect />

      <!-- 通知下拉 -->
      <NoticeDropdown />
    </template>

    <!-- 用户头像（个人中心、注销登录等） -->
    <el-dropdown trigger="click">
      <div class="user-profile">
        <img class="user-profile__avatar" :src="userStore.userInfo.avatar" />
        <span class="user-profile__name">{{ userStore.userInfo.username }}</span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleProfileClick">
            {{ t("navbar.profile") }}
          </el-dropdown-item>
          <el-dropdown-item divided @click="logout">
            {{ t("navbar.logout") }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 设置面板 -->
    <div v-if="defaultSettings.showSettings" @click="settingStore.settingsVisible = true">
      <div class="i-svg:setting" />
    </div>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n();
import defaultSettings from "@/settings";
import { DeviceEnum } from "@/enums/settings/device.enum";
import { useAppStore, useSettingsStore, useUserStore, useTagsViewStore } from "@/store";

import { SidebarColor, ThemeMode } from "@/enums/settings/theme.enum";

const appStore = useAppStore();
const settingStore = useSettingsStore();
const userStore = useUserStore();
const tagsViewStore = useTagsViewStore();

const route = useRoute();
const router = useRouter();
const isDesktop = computed(() => appStore.device === DeviceEnum.DESKTOP);

/**
 * 打开个人中心页面
 */
function handleProfileClick() {
  router.push({ name: "Profile" });
}

// 根据主题和侧边栏配色方案选择 navbar 右侧的样式类
const navbarRightClass = computed(() => {
  // 如果暗黑主题
  if (settingStore.theme === ThemeMode.DARK) {
    return "navbar__right--white";
  }

  // 如果侧边栏是经典蓝
  if (settingStore.sidebarColorScheme === SidebarColor.CLASSIC_BLUE) {
    return "navbar__right--white";
  }
});

/**
 * 注销登录
 */
function logout() {
  // 使用Element Plus的消息框
  ElMessageBox.confirm("确定注销并退出系统吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    lockScroll: false,
    customClass: "logout-message-box",
    distinguishCancelAndClose: true,
    beforeClose: (action, instance, done) => {
      // 在关闭前确保按钮可见
      const btns = document.querySelector('.logout-message-box .el-message-box__btns');
      if (btns) {
        const buttons = btns.querySelectorAll('button');
        buttons.forEach(btn => {
          btn.style.display = 'inline-flex';
          btn.style.visibility = 'visible';
          btn.style.opacity = '1';
          if (btn.classList.contains('el-button--primary')) {
            btn.style.backgroundColor = '#409EFF';
            btn.style.color = 'white';
            btn.style.borderColor = '#409EFF';
          } else {
            btn.style.backgroundColor = 'white';
            btn.style.color = '#606266';
            btn.style.borderColor = '#dcdfe6';
          }
        });
      }
      done();
    }
  }).then(() => {
    userStore
      .logout()
      .then(() => {
        tagsViewStore.delAllViews();
      })
      .then(() => {
        router.push(`/login?redirect=${route.fullPath}`);
      });
  });
}
</script>

<style lang="scss" scoped>
.navbar__right {
  display: flex;
  align-items: center;
  justify-content: center;

  & > * {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: $navbar-height;
    color: var(--el-text-color);
    text-align: center;
    cursor: pointer;

    &:hover {
      background: rgb(0 0 0 / 10%);
    }
  }
  .user-profile {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 13px;

    &__avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    &__name {
      margin-left: 10px;
    }
  }
}

.layout-top .navbar__right--white > *,
.layout-mix .navbar__right--white > * {
  color: #fff;

  // 强制所有svg图标为白色（包括通知图标）
  :deep(svg) {
    color: #fff;
    fill: #fff;
  }
}

.dark .navbar__right > *:hover {
  color: #ccc;
}

/* 全局样式: 确保Element Plus按钮在对话框中正确显示 */
:global(.custom-logout-dialog) {
  :global(.el-button) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  :global(.custom-confirm-button),
  :global(.custom-cancel-button) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
    min-width: 60px;
    margin: 0 5px;
  }
}

/* 自定义对话框样式 */
:global(.custom-confirm-dialog) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
}

:global(.custom-dialog-overlay) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

:global(.custom-dialog-container) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:global(.custom-dialog-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 500;
}

:global(.custom-dialog-close) {
  cursor: pointer;
  font-size: 22px;
}

:global(.custom-dialog-content) {
  padding: 20px;
  display: flex;
  align-items: flex-start;
}

:global(.custom-dialog-icon) {
  margin-right: 10px;
}

:global(.custom-dialog-message) {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
}

:global(.custom-dialog-footer) {
  padding: 10px 20px 20px;
  text-align: right;
}

:global(.custom-dialog-cancel),
:global(.custom-dialog-confirm) {
  padding: 9px 15px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: white;
  cursor: pointer;
  margin-left: 10px;
  transition: all 0.3s;
}

:global(.custom-dialog-cancel) {
  color: #606266;
}

:global(.custom-dialog-cancel:hover) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background-color: var(--el-color-primary-light-9);
}

:global(.custom-dialog-confirm) {
  color: white;
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:global(.custom-dialog-confirm:hover) {
  background: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-3);
}
</style>
