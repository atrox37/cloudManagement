<template>
  <el-card class="card">
    <el-form
      label-position="top"
      ref="loginformRef"
      label-width="100px"
      :model="loginform"
      hide-required-asterisk
    >
      <el-form-item
        prop="account"
        :label="$t('login.email')"
        :rules="[
          {
            required: true,
            message: $t('login.emailRequired'),
            trigger: 'blur',
          },
        ]"
      >
        <el-input
          v-model="loginform.account"
          :placeholder="$t('login.emailPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item
        class="clearfix"
        :label="$t('login.password')"
        prop="password"
        :rules="[
          {
            required: true,
            message: $t('login.passwordRequired'),
            trigger: 'blur',
          },
        ]"
      >
        <el-input
          v-model="loginform.password"
          show-password
          :placeholder="$t('login.passwordPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('login.captcha')">
        <el-input
          v-model="loginform.captcha"
          :placeholder="$t('login.captchaPlaceholder')"
        ></el-input>
        <img ref="captchaRef" alt="图片" @click="captchaclick" />
      </el-form-item>
      <el-form-item class="login_btn_box clearfix">
        <div class="right-flex-contain">
          <el-button
            @click="login()"
            class="login_btn"
            type="primary"
            :loading="loading"
          >{{ $t('login.loginBtn') }}</el-button>
        </div>

      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import tagViewStore from "@/store/tagView.js";
import MD5 from 'crypto-js/md5'
import {
  ref,
  reactive,
  defineComponent,
  getCurrentInstance,
  onMounted,
} from "vue";
import { captchaApi, loginApi } from "@/util/request";

export default defineComponent({
  name: "Login",
  setup(props, context) {
    const { proxy } = getCurrentInstance();
    const loginform = reactive({
      account: "",
      password: "",
      captcha: "",
    });
    const loginformRef = ref(null);
    const captchaRef = ref(null);
    const router = useRouter();

    const loading = ref(false);

    const request = async () => {
      loading.value = true;
      proxy.$http.loginApi({...loginform,password:MD5(loginform.password).toString()}).then(
        (v) => {
          console.log(v);
          loading.value = false;
          if (v && v.code == 200) {
            tagViewStore().cleanView();
            tagViewStore().setPosition(-1);
            window.sessionStorage.setItem("token", v.data);
            router.push("/sys");
          } else {
            ElMessage({
              message: v.msg,
              type: "error",
              plain: true,
            });
          }
        },
        (e) => {
          console.log("loginapi fail");
          loading.value = false;
        }
      );
    };

    function asyncFun(time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`耗时：${time / 1000}s`);
        }, time);
      });
    }

    const login = () => {
      loginformRef.value.validate((valid, fields) => {
        if (valid) {
          request();
        }
      });
    };
    const captchaclick = () => {
      captcha();
    };
    const captcha = () => {
      proxy.$http.captchaApi().then(
        (v) => {
          console.log("captcha api success");
          captchaRef.value.src = v.data.base64;
        },
        (error) => {
          console.log("captcha api fail");
        }
      );
    };

    onMounted(() => {
      console.log("login");
      captcha();
    });

    return {
      captchaRef,
      login,
      loading,
      loginformRef,
      loginform,
      captchaclick,
    };
  },
});
</script>

<style scoped>
.card {
  width: 30%;
  height: auto;
  margin: 0 auto 0 auto;
  transform: translate(0, 100%);
}
</style>
