<template>
  <div>
    <h3 text-center m-0 mb-20px>{{ t("login.login") }}</h3>
    <el-form
      ref="loginFormRef"
      :model="loginFormData"
      :rules="loginRules"
      size="large"
      :validate-on-rule-change="false"
    >
      <!-- 用户名 -->
      <el-form-item prop="username">
        <el-input v-model.trim="loginFormData.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码 -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <el-input
            v-model.trim="loginFormData.password"
            :placeholder="t('login.password')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="handleLoginSubmit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <!-- 验证码 -->
      <el-form-item prop="captchaCode">
        <div flex>
          <el-input
            v-model.trim="loginFormData.captchaCode"
            :placeholder="t('login.captchaCode')"
            @keyup.enter="handleLoginSubmit"
          >
            <template #prefix>
              <div class="i-svg:captcha" />
            </template>
          </el-input>
          <div cursor-pointer h="[40px]" w="[120px]" flex-center ml-10px @click="getCaptcha">
            <el-icon v-if="codeLoading" class="is-loading"><Loading /></el-icon>

            <img
              v-else
              object-cover
              border-rd-4px
              p-1px
              shadow="[0_0_0_1px_var(--el-border-color)_inset]"
              :src="captchaBase64"
              alt="code"
            />
          </div>
        </div>
      </el-form-item>

      <div class="flex-x-between w-full">
        <!-- 使用div和自定义样式替代el-checkbox -->
        <div 
          class="custom-checkbox" 
          @click="toggleRememberMe" 
          style="display: flex; align-items: center; cursor: pointer;"
        >
          <div 
            class="checkbox-box" 
            :class="{'checkbox-checked': loginFormData.rememberMe}"
            style="width: 16px; height: 16px; border: 1px solid #dcdfe6; border-radius: 2px; position: relative; display: flex; align-items: center; justify-content: center;"
          >
            <span 
              v-if="loginFormData.rememberMe" 
              style="color: white; font-size: 12px; line-height: 1;"
              class="checkbox-icon"
            >✓</span>
          </div>
          <span style="margin-left: 5px;">{{ t("login.rememberMe") }}</span>
        </div>
        <el-link type="primary" underline="never" @click="toOtherForm('resetPwd')">
          {{ t("login.forgetPassword") }}
        </el-link>
      </div>

      <!-- 登录按钮 - 使用自定义按钮，额外添加更多明显的样式 -->
      <el-form-item>
        <button 
          class="custom-login-button" 
          :class="{'is-loading': loading}" 
          @click="handleLoginSubmit"
          :disabled="loading"
          type="button"
          style="background-color: #409EFF !important; color: white !important; font-weight: bold; font-size: 16px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); min-height: 40px;"
        >
          <span v-if="loading" class="loading-icon"></span>
          <span style="color: white !important; visibility: visible !important; opacity: 1 !important;">{{ t("login.login") }}</span>
        </button>
      </el-form-item>
    </el-form>

    <div flex-center gap-10px>
      <el-text size="default">{{ t("login.noAccount") }}</el-text>
      <el-link type="primary" underline="never" @click="toOtherForm('register')">
        {{ t("login.reg") }}
      </el-link>
    </div>

    <!-- 第三方登录 -->
    <el-divider>
      <el-text size="small">{{ t("login.otherLoginMethods") }}</el-text>
    </el-divider>
    <div class="flex-center gap-x-5 w-full text-[var(--el-text-color-secondary)]">
      <CommonWrapper>
        <div text-20px class="i-svg:wechat" />
      </CommonWrapper>
      <CommonWrapper>
        <div text-20px cursor-pointer class="i-svg:qq" />
      </CommonWrapper>
      <CommonWrapper>
        <div text-20px cursor-pointer class="i-svg:github" />
      </CommonWrapper>
      <CommonWrapper>
        <div text-20px cursor-pointer class="i-svg:gitee" />
      </CommonWrapper>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { LocationQuery, RouteLocationRaw, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AuthAPI, { type LoginFormData } from "@/api/auth.api";
import router from "@/router";
import { useUserStore } from "@/store";
import CommonWrapper from "@/components/CommonWrapper/index.vue";
import { ElMessage } from "element-plus";

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();

onMounted(() => {
  // 加载验证码
  getCaptcha();
  
  // 检查是否有保存的用户名
  const rememberedUsername = localStorage.getItem('login_remember_username');
  if (rememberedUsername) {
    loginFormData.value.username = rememberedUsername;
    loginFormData.value.rememberMe = true;
    console.log('已从本地存储读取用户名:', rememberedUsername);
  }
  
  // 确保组件样式正确加载
  nextTick(() => {
    // 强制更新视图，确保按钮正确渲染
    const loginButton = document.querySelector('.login-button');
    if (loginButton) {
      // 添加可见性类并设置内联样式以确保按钮显示
      loginButton.classList.add('visible');
      (loginButton as HTMLElement).style.display = 'block';
      (loginButton as HTMLElement).style.visibility = 'visible';
      (loginButton as HTMLElement).style.opacity = '1';
    }
  });
});

const loginFormRef = ref<FormInstance>();
const loading = ref(false); // 按钮 loading 状态
const isCapsLock = ref(false); // 是否大写锁定
const captchaBase64 = ref(); // 验证码图片Base64字符串

const loginFormData = ref<LoginFormData>({
  username: "admin",
  password: "123456",
  captchaKey: "",
  captchaCode: "",
  rememberMe: false,
});

const loginRules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.username.required"),
      },
    ],
    password: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.password.required"),
      },
      {
        min: 6,
        message: t("login.message.password.min"),
        trigger: "blur",
      },
    ],
    captchaCode: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.captchaCode.required"),
      },
    ],
  };
});

// 获取验证码
const codeLoading = ref(false);
function getCaptcha() {
  console.log("开始获取验证码...");
  codeLoading.value = true;
  AuthAPI.getCaptcha()
    .then((data) => {
      console.log("验证码获取成功:", data);
      loginFormData.value.captchaKey = data.captchaKey;
      captchaBase64.value = data.captchaBase64;
    })
    .catch(error => {
      console.error("验证码获取失败:", error);
      ElMessage.error("验证码获取失败，请重试");
    })
    .finally(() => {
      console.log("验证码请求结束");
      codeLoading.value = false;
    });
}

// 登录提交处理
async function handleLoginSubmit() {
  try {
    // 1. 表单验证
    const valid = await loginFormRef.value?.validate();
    if (!valid) return;

    loading.value = true;

    // 2. 执行登录
    await userStore.login(loginFormData.value);

    // 3. 获取用户信息
    await userStore.getUserInfo();

    // 4. 解析并跳转目标地址
    const redirect = resolveRedirectTarget(route.query);
    await router.push(redirect);

    // TODO 5. 判断用户是否点击了记住我？采用明文保存或使用jsencrypt库？
  } catch (error) {
    // 5. 统一错误处理
    getCaptcha(); // 刷新验证码
    console.error("登录失败:", error);
  } finally {
    loading.value = false;
  }
}

/**
 * 解析重定向目标
 * @param query 路由查询参数
 * @returns 标准化后的路由地址对象
 */
function resolveRedirectTarget(query: LocationQuery): RouteLocationRaw {
  // 默认跳转路径
  const defaultPath = "/";

  // 获取原始重定向路径
  const rawRedirect = (query.redirect as string) || defaultPath;

  try {
    // 6. 使用Vue Router解析路径
    const resolved = router.resolve(rawRedirect);
    return {
      path: resolved.path,
      query: resolved.query,
    };
  } catch {
    // 7. 异常处理：返回安全路径
    return { path: defaultPath };
  }
}

// 检查输入大小写
function checkCapsLock(event: KeyboardEvent) {
  // 防止浏览器密码自动填充时报错
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

const emit = defineEmits(["update:modelValue"]);
function toOtherForm(type: "register" | "resetPwd") {
  emit("update:modelValue", type);
}

// 处理"记住我"复选框变化
function toggleRememberMe() {
  // 切换记住我状态
  loginFormData.value.rememberMe = !loginFormData.value.rememberMe;
  console.log('记住我状态已切换为:', loginFormData.value.rememberMe);
  
  // 如果勾选"记住我"，则保存用户名到localStorage
  if (loginFormData.value.rememberMe) {
    if (loginFormData.value.username) {
      localStorage.setItem('login_remember_username', loginFormData.value.username);
      console.log('已保存用户名到本地存储');
    }
  } else {
    localStorage.removeItem('login_remember_username');
    console.log('已清除本地存储的用户名');
  }
}
</script>

<style scoped>
.login-button {
  display: block !important;
  width: 100%;
  visibility: visible !important;
  opacity: 1 !important;
  margin-top: 10px;
  position: relative;
  z-index: 1;
}

/* 确保按钮在不同状态下都可见 */
.el-button.login-button:hover,
.el-button.login-button:focus,
.el-button.login-button:active,
.el-button.login-button {
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
}

/* 自定义登录按钮样式 */
.custom-login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  margin-top: 15px;
  background-color: #409EFF; /* 使用更深的蓝色 */
  color: white;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  user-select: none;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.custom-login-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  border-radius: 4px;
}

.custom-login-button:hover {
  background-color: #337ecc; /* 悬停时的深蓝色 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.custom-login-button:active {
  background-color: #2b6cb0; /* 点击时的更深蓝色 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transform: translateY(1px);
}

.custom-login-button.is-loading {
  opacity: 0.8;
  cursor: wait;
  pointer-events: none;
}

.custom-login-button .loading-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid white;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 自定义复选框样式 */
.custom-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: 1px solid #DCDFE6;
  border-radius: 2px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox-checked {
  background-color: #409EFF;
  border-color: #409EFF;
}

.checkbox-icon {
  color: white;
  font-size: 12px;
  line-height: 1;
  font-weight: bold;
}
</style>
